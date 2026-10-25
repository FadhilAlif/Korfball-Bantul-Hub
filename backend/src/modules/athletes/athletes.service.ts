import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { and, asc, count, eq, gte, ilike, inArray, isNull, ne, or } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import {
  type AthleteStatus,
  type Sex,
  athletes,
  attendances,
  matchPlayers,
  roles,
  sessions,
  teams,
  userRoles,
  users,
} from "../../database/schema/index.js";
import { PermissionsCacheService } from "../permissions/permissions-cache.service.js";
import type { CreateAthleteInput, ListAthletesQuery, UpdateAthleteInput } from "./athletes.schemas.js";

export interface AthleteItem {
  id: number;
  teamId: number;
  teamName: string;
  teamShortName: string | null;
  teamIsInternal: boolean;
  userId: number | null;
  userEmail: string | null;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  sex: Sex;
  jerseyNumber: number | null;
  birthDate: string | null;
  status: AthleteStatus;
  notes: string | null;
  attendance30dRate: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class AthletesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase,
    @Optional()
    @Inject(PermissionsCacheService)
    private readonly permissionsCacheService?: PermissionsCacheService,
  ) {}

  async listAthletes(query: Partial<ListAthletesQuery> = {}) {
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Math.min(200, Number(query.limit))) : 20;
    const conditions = [isNull(athletes.deletedAt)];

    if (query.teamId !== undefined) {
      conditions.push(eq(athletes.teamId, Number(query.teamId)));
    }

    if (query.status !== undefined) {
      conditions.push(eq(athletes.status, query.status));
    }

    if (query.sex !== undefined) {
      conditions.push(eq(athletes.sex, query.sex));
    }

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(or(ilike(athletes.fullName, pattern), ilike(athletes.nickname, pattern))!);
    }

    const whereClause = and(...conditions);

    const [totalRecord] = await this.db.select({ count: count() }).from(athletes).where(whereClause);
    const total = totalRecord?.count ? Number(totalRecord.count) : 0;

    const rows = await this.db
      .select({
        athlete: athletes,
        teamName: teams.name,
        teamShortName: teams.shortName,
        teamIsInternal: teams.isInternal,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
      })
      .from(athletes)
      .innerJoin(teams, eq(athletes.teamId, teams.id))
      .leftJoin(users, and(eq(athletes.userId, users.id), isNull(users.deletedAt)))
      .where(whereClause)
      .orderBy(asc(athletes.fullName))
      .limit(limit)
      .offset((page - 1) * limit);

    const internalAthleteIds = rows.filter((r) => r.teamIsInternal).map((r) => r.athlete.id);

    const rateByAthleteId = await this.compute30DayAttendanceRates(internalAthleteIds);

    const data: AthleteItem[] = rows.map((r) => ({
      id: r.athlete.id,
      teamId: r.athlete.teamId,
      teamName: r.teamName,
      teamShortName: r.teamShortName,
      teamIsInternal: r.teamIsInternal,
      userId: r.athlete.userId,
      userEmail: r.userEmail ?? null,
      fullName: r.athlete.fullName,
      nickname: r.athlete.nickname,
      photoUrl: r.athlete.photoUrl ?? r.userAvatarUrl ?? null,
      sex: r.athlete.sex,
      jerseyNumber: r.athlete.jerseyNumber,
      birthDate: r.athlete.birthDate,
      status: r.athlete.status,
      notes: r.athlete.notes,
      attendance30dRate: r.teamIsInternal ? (rateByAthleteId.get(r.athlete.id) ?? null) : null,
      createdAt: r.athlete.createdAt,
      updatedAt: r.athlete.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getAthlete(athleteId: number): Promise<AthleteItem> {
    const [row] = await this.db
      .select({
        athlete: athletes,
        teamName: teams.name,
        teamShortName: teams.shortName,
        teamIsInternal: teams.isInternal,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
      })
      .from(athletes)
      .innerJoin(teams, eq(athletes.teamId, teams.id))
      .leftJoin(users, and(eq(athletes.userId, users.id), isNull(users.deletedAt)))
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!row) {
      throw new NotFoundException("Atlet tidak ditemukan.");
    }

    const rateByAthleteId = row.teamIsInternal
      ? await this.compute30DayAttendanceRates([row.athlete.id])
      : new Map<number, number | null>();

    return {
      id: row.athlete.id,
      teamId: row.athlete.teamId,
      teamName: row.teamName,
      teamShortName: row.teamShortName,
      teamIsInternal: row.teamIsInternal,
      userId: row.athlete.userId,
      userEmail: row.userEmail ?? null,
      fullName: row.athlete.fullName,
      nickname: row.athlete.nickname,
      photoUrl: row.athlete.photoUrl ?? row.userAvatarUrl ?? null,
      sex: row.athlete.sex,
      jerseyNumber: row.athlete.jerseyNumber,
      birthDate: row.athlete.birthDate,
      status: row.athlete.status,
      notes: row.athlete.notes,
      attendance30dRate: row.teamIsInternal ? (rateByAthleteId.get(row.athlete.id) ?? null) : null,
      createdAt: row.athlete.createdAt,
      updatedAt: row.athlete.updatedAt,
    };
  }

  async createAthlete(input: CreateAthleteInput): Promise<AthleteItem> {
    const [team] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, input.teamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!team) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    if (input.userId !== undefined && input.userId !== null) {
      await this.validateUserLinking(team.isInternal, input.userId);
    }

    const trimmedFullName = input.fullName.trim();
    const defaultNickname = trimmedFullName.split(/\s+/)[0]?.slice(0, 30) ?? trimmedFullName;
    const resolvedNickname =
      input.nickname && input.nickname.trim().length > 0 ? input.nickname.trim() : defaultNickname;

    const [created] = await this.db
      .insert(athletes)
      .values({
        teamId: input.teamId,
        userId: input.userId ?? null,
        fullName: trimmedFullName,
        nickname: resolvedNickname,
        photoUrl: input.photoUrl ?? null,
        sex: input.sex,
        jerseyNumber: input.jerseyNumber ?? null,
        birthDate: input.birthDate ?? null,
        status: input.status ?? "ACTIVE",
        notes: input.notes ? input.notes.trim() : null,
      })
      .returning({ id: athletes.id });

    if (input.userId) {
      await this.ensureAthleteRole(input.userId);
      await this.permissionsCacheService?.invalidateUser(input.userId);
    }

    if (!created) {
      throw new NotFoundException("Gagal membuat profil atlet.");
    }

    return this.getAthlete(created.id);
  }

  async updateAthlete(athleteId: number, input: UpdateAthleteInput): Promise<AthleteItem> {
    const [existing] = await this.db
      .select()
      .from(athletes)
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Atlet tidak ditemukan.");
    }

    const targetTeamId = input.teamId ?? existing.teamId;
    const [targetTeam] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, targetTeamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!targetTeam) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    const resultingUserId = input.userId !== undefined ? input.userId : existing.userId;
    if (resultingUserId !== null) {
      await this.validateUserLinking(targetTeam.isInternal, resultingUserId, athleteId);
    }

    await this.db
      .update(athletes)
      .set({
        ...(input.teamId !== undefined ? { teamId: input.teamId } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.nickname !== undefined ? { nickname: input.nickname ? input.nickname.trim() : null } : {}),
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
        ...(input.sex !== undefined ? { sex: input.sex } : {}),
        ...(input.jerseyNumber !== undefined ? { jerseyNumber: input.jerseyNumber } : {}),
        ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ? input.notes.trim() : null } : {}),
      })
      .where(eq(athletes.id, athleteId));

    if (input.photoUrl !== undefined && resultingUserId !== null) {
      await this.db.update(users).set({ avatarUrl: input.photoUrl }).where(eq(users.id, resultingUserId));
    }

    if (existing.userId && existing.userId !== resultingUserId) {
      await this.cleanupAthleteRole(existing.userId);
      await this.permissionsCacheService?.invalidateUser(existing.userId);
    }
    if (resultingUserId && resultingUserId !== existing.userId) {
      await this.ensureAthleteRole(resultingUserId);
      await this.permissionsCacheService?.invalidateUser(resultingUserId);
    }

    return this.getAthlete(athleteId);
  }

  async linkUser(athleteId: number, userId: number): Promise<AthleteItem> {
    const [row] = await this.db
      .select({
        athlete: athletes,
        teamIsInternal: teams.isInternal,
      })
      .from(athletes)
      .innerJoin(teams, eq(athletes.teamId, teams.id))
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!row) {
      throw new NotFoundException("Atlet tidak ditemukan.");
    }

    const linkedUser = await this.validateUserLinking(row.teamIsInternal, userId, athleteId);

    const previousUserId = row.athlete.userId;

    await this.db.update(athletes).set({ userId }).where(eq(athletes.id, athleteId));

    if (row.athlete.photoUrl && !linkedUser.avatarUrl) {
      await this.db.update(users).set({ avatarUrl: row.athlete.photoUrl }).where(eq(users.id, userId));
    } else if (!row.athlete.photoUrl && linkedUser.avatarUrl) {
      await this.db.update(athletes).set({ photoUrl: linkedUser.avatarUrl }).where(eq(athletes.id, athleteId));
    }

    await this.ensureAthleteRole(userId);

    if (previousUserId && previousUserId !== userId) {
      await this.cleanupAthleteRole(previousUserId);
      await this.permissionsCacheService?.invalidateUser(previousUserId);
    }
    await this.permissionsCacheService?.invalidateUser(userId);

    return this.getAthlete(athleteId);
  }

  async unlinkUser(athleteId: number): Promise<AthleteItem> {
    const [existing] = await this.db
      .select()
      .from(athletes)
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Atlet tidak ditemukan.");
    }

    const previousUserId = existing.userId;

    await this.db.update(athletes).set({ userId: null }).where(eq(athletes.id, athleteId));

    if (previousUserId) {
      await this.cleanupAthleteRole(previousUserId);
      await this.permissionsCacheService?.invalidateUser(previousUserId);
    }

    return this.getAthlete(athleteId);
  }

  async deleteAthlete(athleteId: number): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(athletes)
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Atlet tidak ditemukan.");
    }

    // BR-03: Atlet yang memiliki histori (attendances, match_players) tidak boleh dihapus
    const [attendanceCountRow] = await this.db
      .select({ count: count() })
      .from(attendances)
      .where(eq(attendances.athleteId, athleteId));

    const [lineupCountRow] = await this.db
      .select({ count: count() })
      .from(matchPlayers)
      .where(eq(matchPlayers.athleteId, athleteId));

    const hasHistory = Number(attendanceCountRow?.count ?? 0) > 0 || Number(lineupCountRow?.count ?? 0) > 0;

    if (hasHistory) {
      throw new ConflictException("Data memiliki histori, nonaktifkan saja.");
    }

    await this.db
      .update(athletes)
      .set({
        deletedAt: new Date(),
        status: "INACTIVE",
        userId: null,
      })
      .where(eq(athletes.id, athleteId));

    if (existing.userId) {
      await this.cleanupAthleteRole(existing.userId);
      await this.permissionsCacheService?.invalidateUser(existing.userId);
    }
  }

  private async ensureAthleteRole(userId: number): Promise<void> {
    const [athleteRole] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, "athlete"))
      .limit(1);

    if (athleteRole) {
      await this.db
        .insert(userRoles)
        .values({ userId, roleId: athleteRole.id })
        .onConflictDoNothing();
    }
  }

  private async cleanupAthleteRole(userId: number): Promise<void> {
    const [athleteRole] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, "athlete"))
      .limit(1);

    if (!athleteRole) return;

    const [otherAthlete] = await this.db
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(eq(athletes.userId, userId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!otherAthlete) {
      await this.db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, athleteRole.id)));
    }
  }

  private async validateUserLinking(
    teamIsInternal: boolean,
    userId: number,
    excludeAthleteId?: number,
  ): Promise<{ id: number; avatarUrl?: string | null }> {
    // BR-01: Hanya atlet tim internal yang dapat ditautkan ke akun user
    if (!teamIsInternal) {
      throw new BadRequestException("Atlet bukan anggota tim internal.");
    }

    const [user] = await this.db
      .select({ id: users.id, avatarUrl: users.avatarUrl })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundException("Akun user tidak ditemukan.");
    }

    // BR-02: Satu user maksimal tertaut ke satu atlet
    const conflictConditions = [eq(athletes.userId, userId), isNull(athletes.deletedAt)];
    if (excludeAthleteId !== undefined) {
      conflictConditions.push(ne(athletes.id, excludeAthleteId));
    }

    const [conflict] = await this.db
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(...conflictConditions))
      .limit(1);

    if (conflict) {
      throw new ConflictException("Akun sudah tertaut ke atlet lain.");
    }

    return user;
  }

  private async compute30DayAttendanceRates(athleteIds: number[]): Promise<Map<number, number | null>> {
    const result = new Map<number, number | null>();
    if (athleteIds.length === 0) return result;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await this.db
      .select({
        athleteId: attendances.athleteId,
        status: attendances.status,
      })
      .from(attendances)
      .innerJoin(sessions, eq(attendances.sessionId, sessions.id))
      .where(
        and(
          inArray(attendances.athleteId, athleteIds),
          eq(sessions.status, "COMPLETED"),
          isNull(sessions.deletedAt),
          gte(sessions.startsAt, thirtyDaysAgo),
        ),
      );

    const countsByAthlete = new Map<number, { attended: number; total: number }>();
    for (const row of rows) {
      const current = countsByAthlete.get(row.athleteId) ?? { attended: 0, total: 0 };
      current.total += 1;
      if (row.status === "PRESENT" || row.status === "LATE") {
        current.attended += 1;
      }
      countsByAthlete.set(row.athleteId, current);
    }

    for (const id of athleteIds) {
      const counts = countsByAthlete.get(id);
      if (!counts || counts.total === 0) {
        result.set(id, null);
      } else {
        result.set(id, Math.round((counts.attended / counts.total) * 1000) / 10);
      }
    }

    return result;
  }
}
