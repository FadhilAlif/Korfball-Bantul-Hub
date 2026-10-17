import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, count, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import {
  type SessionStatus,
  type SessionType,
  attendances,
  sessions,
  teams,
  users,
} from "../../database/schema/index.js";
import type {
  CreateSessionInput,
  GenerateRoutineInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from "./sessions.schemas.js";
import { createWibDate, generateCheckinCode, toWibParts } from "./sessions.utils.js";

export interface AttendanceCountsSummary {
  present: number;
  late: number;
  excused: number;
  absent: number;
  attended: number; // present + late
  total: number;
}

export interface SessionItem {
  id: number;
  teamId: number;
  teamName: string;
  type: SessionType;
  title: string;
  startsAt: Date | string;
  endsAt: Date | string;
  venue: string | null;
  lateToleranceMinutes: number;
  checkinCode: string;
  status: SessionStatus;
  notes: string | null;
  createdBy: number | null;
  createdByName?: string | null;
  finalizedAt: Date | string | null;
  finalizedBy: number | null;
  attendanceSummary: AttendanceCountsSummary;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class SessionsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  async listSessions(query: Partial<ListSessionsQuery> = {}) {
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Math.min(100, Number(query.limit))) : 20;
    const conditions = [isNull(sessions.deletedAt)];

    if (query.teamId !== undefined) {
      conditions.push(eq(sessions.teamId, Number(query.teamId)));
    }

    if (query.type !== undefined) {
      conditions.push(eq(sessions.type, query.type));
    }

    if (query.status !== undefined) {
      conditions.push(eq(sessions.status, query.status));
    }

    if (query.from) {
      conditions.push(gte(sessions.startsAt, new Date(query.from)));
    }

    if (query.to) {
      conditions.push(lte(sessions.endsAt, new Date(query.to)));
    }

    const whereClause = and(...conditions);

    const [totalRecord] = await this.db.select({ count: count() }).from(sessions).where(whereClause);
    const total = totalRecord?.count ? Number(totalRecord.count) : 0;

    const rows = await this.db
      .select({
        session: sessions,
        teamName: teams.name,
        createdByName: users.fullName,
      })
      .from(sessions)
      .innerJoin(teams, eq(sessions.teamId, teams.id))
      .leftJoin(users, eq(sessions.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(sessions.startsAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const sessionIds = rows.map((r) => r.session.id);
    const summaryMap = await this.getAttendanceSummaries(sessionIds);

    const data: SessionItem[] = rows.map((r) => ({
      id: r.session.id,
      teamId: r.session.teamId,
      teamName: r.teamName,
      type: r.session.type,
      title: r.session.title,
      startsAt: r.session.startsAt,
      endsAt: r.session.endsAt,
      venue: r.session.venue,
      lateToleranceMinutes: r.session.lateToleranceMinutes,
      checkinCode: r.session.checkinCode,
      status: r.session.status,
      notes: r.session.notes,
      createdBy: r.session.createdBy,
      createdByName: r.createdByName ?? null,
      finalizedAt: r.session.finalizedAt,
      finalizedBy: r.session.finalizedBy,
      attendanceSummary: summaryMap.get(r.session.id) ?? {
        present: 0,
        late: 0,
        excused: 0,
        absent: 0,
        attended: 0,
        total: 0,
      },
      createdAt: r.session.createdAt,
      updatedAt: r.session.updatedAt,
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

  async getSession(sessionId: number): Promise<SessionItem> {
    const [row] = await this.db
      .select({
        session: sessions,
        teamName: teams.name,
        createdByName: users.fullName,
      })
      .from(sessions)
      .innerJoin(teams, eq(sessions.teamId, teams.id))
      .leftJoin(users, eq(sessions.createdBy, users.id))
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!row) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    const summaryMap = await this.getAttendanceSummaries([row.session.id]);
    const summary = summaryMap.get(row.session.id) ?? {
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      attended: 0,
      total: 0,
    };

    return {
      id: row.session.id,
      teamId: row.session.teamId,
      teamName: row.teamName,
      type: row.session.type,
      title: row.session.title,
      startsAt: row.session.startsAt,
      endsAt: row.session.endsAt,
      venue: row.session.venue,
      lateToleranceMinutes: row.session.lateToleranceMinutes,
      checkinCode: row.session.checkinCode,
      status: row.session.status,
      notes: row.session.notes,
      createdBy: row.session.createdBy,
      createdByName: row.createdByName ?? null,
      finalizedAt: row.session.finalizedAt,
      finalizedBy: row.session.finalizedBy,
      attendanceSummary: summary,
      createdAt: row.session.createdAt,
      updatedAt: row.session.updatedAt,
    };
  }

  async createSession(input: CreateSessionInput, userId?: number): Promise<SessionItem> {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException("Jam selesai harus setelah jam mulai.");
    }

    const targetTeamId = await this.resolveTeamId(input.teamId);

    const checkinCode = generateCheckinCode();

    const [created] = await this.db
      .insert(sessions)
      .values({
        teamId: targetTeamId,
        type: input.type ?? "TRAINING",
        title: input.title.trim(),
        startsAt,
        endsAt,
        venue: input.venue ? input.venue.trim() : null,
        lateToleranceMinutes: input.lateToleranceMinutes ?? 15,
        checkinCode,
        status: "SCHEDULED",
        notes: input.notes ? input.notes.trim() : null,
        createdBy: userId ?? null,
      })
      .returning({ id: sessions.id });

    return this.getSession(created.id);
  }

  async updateSession(sessionId: number, input: UpdateSessionInput): Promise<SessionItem> {
    const [existing] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (existing.status === "CANCELLED") {
      throw new ConflictException("Sesi dibatalkan dan tidak dapat diubah.");
    }

    const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException("Jam selesai harus setelah jam mulai.");
    }

    await this.db
      .update(sessions)
      .set({
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.startsAt !== undefined ? { startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt } : {}),
        ...(input.venue !== undefined ? { venue: input.venue ? input.venue.trim() : null } : {}),
        ...(input.lateToleranceMinutes !== undefined ? { lateToleranceMinutes: input.lateToleranceMinutes } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ? input.notes.trim() : null } : {}),
      })
      .where(eq(sessions.id, sessionId));

    return this.getSession(sessionId);
  }

  async deleteSession(sessionId: number): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    // Hanya jika belum ada record presensi
    const [attCount] = await this.db
      .select({ count: count() })
      .from(attendances)
      .where(eq(attendances.sessionId, sessionId));

    if (Number(attCount?.count ?? 0) > 0) {
      throw new ConflictException("Sesi sudah memiliki data presensi dan tidak dapat dihapus.");
    }

    await this.db.update(sessions).set({ deletedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  async cancelSession(sessionId: number): Promise<SessionItem> {
    const [existing] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (existing.status === "COMPLETED") {
      throw new ConflictException("Sesi yang sudah selesai tidak dapat dibatalkan.");
    }

    await this.db.update(sessions).set({ status: "CANCELLED" }).where(eq(sessions.id, sessionId));

    return this.getSession(sessionId);
  }

  async regenerateCheckinCode(sessionId: number): Promise<{ checkinCode: string }> {
    const [existing] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (existing.status !== "SCHEDULED") {
      throw new ConflictException("Kode check-in hanya dapat diubah untuk sesi berstatus SCHEDULED.");
    }

    const checkinCode = generateCheckinCode();
    await this.db.update(sessions).set({ checkinCode }).where(eq(sessions.id, sessionId));

    return { checkinCode };
  }

  /**
   * Generates routine training sessions:
   * - Tuesday: 18:00 - 20:00 WIB
   * - Saturday: 19:00 - 21:00 WIB
   * for 1 to 4 weeks starting from startDate (or today). Skips duplicates.
   */
  async generateRoutine(
    input: GenerateRoutineInput,
    userId?: number,
  ): Promise<{
    createdCount: number;
    skippedCount: number;
    createdSessions: SessionItem[];
  }> {
    const teamId = await this.resolveTeamId(input.teamId);
    const weeks = input.weeks ?? 4;
    const venue = input.venue ?? "GOR Stadion Sultan Agung Bantul";
    const lateToleranceMinutes = input.lateToleranceMinutes ?? 15;

    const baseDate = input.startDate ? new Date(`${input.startDate}T00:00:00+07:00`) : new Date();

    const createdSessions: SessionItem[] = [];
    let skippedCount = 0;

    const totalDays = weeks * 7;
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const current = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const wib = toWibParts(current);
      const dateStr = `${wib.year}-${String(wib.month).padStart(2, "0")}-${String(wib.day).padStart(2, "0")}`;

      // 2 = Tuesday, 6 = Saturday
      if (wib.dayOfWeek === 2) {
        // Selasa: 18:00 - 20:00 WIB
        const startsAt = createWibDate(dateStr, "18:00");
        const endsAt = createWibDate(dateStr, "20:00");
        const title = "Latihan Rutin Selasa";

        const created = await this.createRoutineIfNotExists(
          teamId,
          title,
          startsAt,
          endsAt,
          venue,
          lateToleranceMinutes,
          userId,
        );

        if (created) {
          createdSessions.push(created);
        } else {
          skippedCount++;
        }
      } else if (wib.dayOfWeek === 6) {
        // Sabtu: 19:00 - 21:00 WIB
        const startsAt = createWibDate(dateStr, "19:00");
        const endsAt = createWibDate(dateStr, "21:00");
        const title = "Latihan Rutin Sabtu";

        const created = await this.createRoutineIfNotExists(
          teamId,
          title,
          startsAt,
          endsAt,
          venue,
          lateToleranceMinutes,
          userId,
        );

        if (created) {
          createdSessions.push(created);
        } else {
          skippedCount++;
        }
      }
    }

    return {
      createdCount: createdSessions.length,
      skippedCount,
      createdSessions,
    };
  }

  private async createRoutineIfNotExists(
    teamId: number,
    title: string,
    startsAt: Date,
    endsAt: Date,
    venue: string,
    lateToleranceMinutes: number,
    userId?: number,
  ): Promise<SessionItem | null> {
    const [existing] = await this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.teamId, teamId), eq(sessions.startsAt, startsAt), isNull(sessions.deletedAt)))
      .limit(1);

    if (existing) {
      return null;
    }

    const checkinCode = generateCheckinCode();
    const [created] = await this.db
      .insert(sessions)
      .values({
        teamId,
        type: "TRAINING",
        title,
        startsAt,
        endsAt,
        venue,
        lateToleranceMinutes,
        checkinCode,
        status: "SCHEDULED",
        createdBy: userId ?? null,
      })
      .returning({ id: sessions.id });

    return this.getSession(created.id);
  }

  private async resolveTeamId(providedTeamId?: number): Promise<number> {
    if (providedTeamId) {
      const [team] = await this.db
        .select({ id: teams.id })
        .from(teams)
        .where(and(eq(teams.id, providedTeamId), isNull(teams.deletedAt)))
        .limit(1);

      if (!team) {
        throw new NotFoundException("Tim tidak ditemukan.");
      }
      return team.id;
    }

    const [internalTeam] = await this.db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.isInternal, true), isNull(teams.deletedAt)))
      .limit(1);

    if (!internalTeam) {
      throw new NotFoundException("Tim internal tidak ditemukan.");
    }

    return internalTeam.id;
  }

  private async getAttendanceSummaries(sessionIds: number[]): Promise<Map<number, AttendanceCountsSummary>> {
    const result = new Map<number, AttendanceCountsSummary>();
    if (sessionIds.length === 0) return result;

    const rows = await this.db
      .select({
        sessionId: attendances.sessionId,
        status: attendances.status,
        count: count(),
      })
      .from(attendances)
      .where(inArray(attendances.sessionId, sessionIds))
      .groupBy(attendances.sessionId, attendances.status);

    for (const id of sessionIds) {
      result.set(id, {
        present: 0,
        late: 0,
        excused: 0,
        absent: 0,
        attended: 0,
        total: 0,
      });
    }

    for (const r of rows) {
      const summary = result.get(r.sessionId);
      if (!summary) continue;

      const c = Number(r.count);
      summary.total += c;
      if (r.status === "PRESENT") {
        summary.present += c;
        summary.attended += c;
      } else if (r.status === "LATE") {
        summary.late += c;
        summary.attended += c;
      } else if (r.status === "EXCUSED") {
        summary.excused += c;
      } else if (r.status === "ABSENT") {
        summary.absent += c;
      }
    }

    return result;
  }
}
