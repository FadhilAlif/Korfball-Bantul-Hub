import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import { athletes, matches, sessions, teams } from "../../database/schema/index.js";
import type { CreateTeamInput, ListTeamsQuery, UpdateTeamInput } from "./teams.schemas.js";

export interface TeamItem {
  id: number;
  name: string;
  shortName: string | null;
  isInternal: boolean;
  region: string | null;
  color: string;
  activeAthletesCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class TeamsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  async listTeams(query: Partial<ListTeamsQuery> = {}) {
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Math.min(100, Number(query.limit))) : 20;
    const conditions = [isNull(teams.deletedAt)];

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(or(ilike(teams.name, pattern), ilike(teams.shortName, pattern), ilike(teams.region, pattern))!);
    }

    if (query.isInternal !== undefined) {
      conditions.push(eq(teams.isInternal, query.isInternal === "true"));
    }

    const whereClause = and(...conditions);

    const [totalRecord] = await this.db.select({ count: count() }).from(teams).where(whereClause);
    const total = totalRecord?.count ? Number(totalRecord.count) : 0;

    const rows = await this.db
      .select()
      .from(teams)
      .where(whereClause)
      .orderBy(desc(teams.isInternal), asc(teams.name))
      .limit(limit)
      .offset((page - 1) * limit);

    const data: TeamItem[] = await Promise.all(
      rows.map(async (t) => {
        const activeAthletesCount = await this.countActiveAthletes(t.id);
        return {
          id: t.id,
          name: t.name,
          shortName: t.shortName,
          isInternal: t.isInternal,
          region: t.region,
          color: t.color,
          activeAthletesCount,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getTeam(teamId: number): Promise<TeamItem> {
    const [team] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!team) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    const activeAthletesCount = await this.countActiveAthletes(team.id);

    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      isInternal: team.isInternal,
      region: team.region,
      color: team.color,
      activeAthletesCount,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  async createTeam(input: CreateTeamInput): Promise<TeamItem> {
    const normalizedName = input.name.trim();
    const [existing] = await this.db
      .select({ id: teams.id })
      .from(teams)
      .where(and(sql`lower(${teams.name}) = lower(${normalizedName})`, isNull(teams.deletedAt)))
      .limit(1);

    if (existing) {
      throw new ConflictException("Nama tim sudah digunakan.");
    }

    const isInternal = input.isInternal ?? false;
    const defaultColor = isInternal ? "#FACC15" : "#3B82F6";

    const [created] = await this.db
      .insert(teams)
      .values({
        name: normalizedName,
        shortName: input.shortName ? input.shortName.trim() : null,
        isInternal,
        region: input.region ? input.region.trim() : null,
        color: input.color ?? defaultColor,
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      shortName: created.shortName,
      isInternal: created.isInternal,
      region: created.region,
      color: created.color,
      activeAthletesCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateTeam(teamId: number, input: UpdateTeamInput): Promise<TeamItem> {
    const [existing] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    if (input.name !== undefined) {
      const normalizedName = input.name.trim();
      const [conflict] = await this.db
        .select({ id: teams.id })
        .from(teams)
        .where(and(sql`lower(${teams.name}) = lower(${normalizedName})`, ne(teams.id, teamId), isNull(teams.deletedAt)))
        .limit(1);

      if (conflict) {
        throw new ConflictException("Nama tim sudah digunakan.");
      }
    }

    await this.db
      .update(teams)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.shortName !== undefined ? { shortName: input.shortName ? input.shortName.trim() : null } : {}),
        ...(input.isInternal !== undefined ? { isInternal: input.isInternal } : {}),
        ...(input.region !== undefined ? { region: input.region ? input.region.trim() : null } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      })
      .where(eq(teams.id, teamId));

    return this.getTeam(teamId);
  }

  async deleteTeam(teamId: number): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    // BR-03: Tim yang memiliki histori (athletes, sessions, matches) tidak boleh dihapus
    const [athleteCountRow] = await this.db
      .select({ count: count() })
      .from(athletes)
      .where(and(eq(athletes.teamId, teamId), isNull(athletes.deletedAt)));

    const [sessionCountRow] = await this.db
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.teamId, teamId), isNull(sessions.deletedAt)));

    const [matchCountRow] = await this.db
      .select({ count: count() })
      .from(matches)
      .where(and(or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)), isNull(matches.deletedAt)));

    const hasHistory =
      Number(athleteCountRow?.count ?? 0) > 0 ||
      Number(sessionCountRow?.count ?? 0) > 0 ||
      Number(matchCountRow?.count ?? 0) > 0;

    if (hasHistory) {
      throw new ConflictException("Data memiliki histori, nonaktifkan saja.");
    }

    await this.db.update(teams).set({ deletedAt: new Date() }).where(eq(teams.id, teamId));
  }

  private async countActiveAthletes(teamId: number): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(athletes)
      .where(and(eq(athletes.teamId, teamId), eq(athletes.status, "ACTIVE"), isNull(athletes.deletedAt)));

    return row?.count ? Number(row.count) : 0;
  }
}
