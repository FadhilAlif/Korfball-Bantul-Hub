import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import {
  type AthleteStatus,
  type AttendanceMethod,
  type AttendanceStatus,
  type SessionType,
  type Sex,
  athletes,
  attendances,
  sessions,
  teams,
  users,
} from "../../database/schema/index.js";
import { buildWorkbook } from "../../lib/exporters/table-workbook.js";
import { calculateHaversineDistanceMeters, computeAttendanceRate } from "./attendance.calculator.js";
import type {
  AttendanceSummaryQuery,
  BulkAttendanceInput,
  MyAttendanceQuery,
  SelfCheckinInput,
} from "./attendance.schemas.js";
import { CheckinThrottleService } from "./checkin-throttle.service.js";

export interface AttendanceSheetRow {
  athleteId: number;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  sex: Sex;
  jerseyNumber: number | null;
  athleteStatus: AthleteStatus;
  status: AttendanceStatus | null;
  method: AttendanceMethod | null;
  checkedInAt: Date | string | null;
  checkinDistanceMeters?: number | null;
  note: string | null;
  recordedBy: number | null;
  recordedByName?: string | null;
}

export interface AttendanceSheetResponse {
  session: {
    id: number;
    teamId: number;
    teamName: string;
    title: string;
    type: SessionType;
    startsAt: Date | string;
    endsAt: Date | string;
    venue: string | null;
    latitude?: number | null;
    longitude?: number | null;
    radiusMeters?: number;
    lateToleranceMinutes: number;
    checkinCode: string;
    status: string;
    finalizedAt: Date | string | null;
  };
  summary: {
    present: number;
    late: number;
    excused: number;
    absent: number;
    attended: number;
    unrecorded: number;
    totalAthletes: number;
  };
  records: AttendanceSheetRow[];
}

export interface AthleteAttendanceSummaryItem {
  athleteId: number;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  sex: Sex;
  jerseyNumber: number | null;
  status: AthleteStatus;
  present: number;
  late: number;
  excused: number;
  absent: number;
  totalSessions: number;
  attendanceRate: number | null;
}

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase,
    @Inject(CheckinThrottleService) private readonly throttle: CheckinThrottleService,
  ) {}

  /**
   * Fetches official attendance sheet for a session:
   * Returns session header, summary count, and active internal athletes + athletes with existing records.
   */
  async getSessionAttendanceSheet(sessionId: number): Promise<AttendanceSheetResponse> {
    const [sessionRow] = await this.db
      .select({
        session: sessions,
        teamName: teams.name,
      })
      .from(sessions)
      .innerJoin(teams, eq(sessions.teamId, teams.id))
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!sessionRow) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    const { session, teamName } = sessionRow;

    // Get all attendances for this session
    const existingRecords = await this.db
      .select({
        attendance: attendances,
        recordedByName: users.fullName,
      })
      .from(attendances)
      .leftJoin(users, eq(attendances.recordedBy, users.id))
      .where(eq(attendances.sessionId, sessionId));

    const recordByAthleteId = new Map(existingRecords.map((r) => [r.attendance.athleteId, r]));

    // Get all ACTIVE athletes in session's team OR athletes with existing records in this session
    const activeAthletes = await this.db
      .select()
      .from(athletes)
      .where(and(eq(athletes.teamId, session.teamId), isNull(athletes.deletedAt), eq(athletes.status, "ACTIVE")));

    const activeMap = new Map(activeAthletes.map((a) => [a.id, a]));

    // If an inactive athlete has a record in this session, fetch them too
    const extraAthleteIds = existingRecords.map((r) => r.attendance.athleteId).filter((id) => !activeMap.has(id));

    if (extraAthleteIds.length > 0) {
      const extraAthletes = await this.db
        .select()
        .from(athletes)
        .where(and(inArray(athletes.id, extraAthleteIds), isNull(athletes.deletedAt)));
      for (const a of extraAthletes) {
        activeMap.set(a.id, a);
      }
    }

    const combinedAthletes = Array.from(activeMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;
    let unrecorded = 0;

    const rows: AttendanceSheetRow[] = combinedAthletes.map((a) => {
      const rec = recordByAthleteId.get(a.id);
      if (!rec) {
        unrecorded++;
        return {
          athleteId: a.id,
          fullName: a.fullName,
          nickname: a.nickname,
          photoUrl: a.photoUrl ?? null,
          sex: a.sex,
          jerseyNumber: a.jerseyNumber,
          athleteStatus: a.status,
          status: null,
          method: null,
          checkedInAt: null,
          checkinDistanceMeters: null,
          note: null,
          recordedBy: null,
          recordedByName: null,
        };
      }

      const st = rec.attendance.status;
      if (st === "PRESENT") present++;
      else if (st === "LATE") late++;
      else if (st === "EXCUSED") excused++;
      else if (st === "ABSENT") absent++;

      return {
        athleteId: a.id,
        fullName: a.fullName,
        nickname: a.nickname,
        photoUrl: a.photoUrl ?? null,
        sex: a.sex,
        jerseyNumber: a.jerseyNumber,
        athleteStatus: a.status,
        status: st,
        method: rec.attendance.method,
        checkedInAt: rec.attendance.checkedInAt,
        checkinDistanceMeters: rec.attendance.checkinDistanceMeters ?? null,
        note: rec.attendance.note,
        recordedBy: rec.attendance.recordedBy,
        recordedByName: rec.recordedByName ?? null,
      };
    });

    return {
      session: {
        id: session.id,
        teamId: session.teamId,
        teamName,
        title: session.title,
        type: session.type,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        venue: session.venue,
        latitude: session.latitude ?? null,
        longitude: session.longitude ?? null,
        radiusMeters: session.radiusMeters ?? 100,
        lateToleranceMinutes: session.lateToleranceMinutes,
        checkinCode: session.checkinCode,
        status: session.status,
        finalizedAt: session.finalizedAt,
      },
      summary: {
        present,
        late,
        excused,
        absent,
        attended: present + late,
        unrecorded,
        totalAthletes: combinedAthletes.length,
      },
      records: rows,
    };
  }

  /**
   * Bulk updates attendance records for a session in a single database transaction.
   * BR-06: Disallowed if session is CANCELLED.
   * BR-08: Upsert replaces existing record for the athlete.
   */
  async bulkUpdateAttendance(
    sessionId: number,
    input: BulkAttendanceInput,
    recordedByUserId: number,
  ): Promise<AttendanceSheetResponse> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!session) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (session.status === "CANCELLED") {
      throw new ConflictException("Sesi dibatalkan.");
    }

    await this.db.transaction(async (tx) => {
      for (const item of input.records) {
        await tx
          .insert(attendances)
          .values({
            sessionId,
            athleteId: item.athleteId,
            status: item.status,
            method: "MANUAL",
            note: item.note ? item.note.trim() : null,
            recordedBy: recordedByUserId,
          })
          .onConflictDoUpdate({
            target: [attendances.sessionId, attendances.athleteId],
            set: {
              status: item.status,
              method: "MANUAL",
              note: item.note ? item.note.trim() : null,
              recordedBy: recordedByUserId,
              updatedAt: new Date(),
            },
          });
      }
    });

    return this.getSessionAttendanceSheet(sessionId);
  }

  /**
   * Finalizes a session:
   * BR-07: In 1 transaction, creates ABSENT records (method = SYSTEM) for all ACTIVE internal
   * team athletes without an existing attendance record, and marks session as COMPLETED.
   */
  async finalizeSession(sessionId: number, finalizedByUserId: number): Promise<AttendanceSheetResponse> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!session) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (session.status === "CANCELLED") {
      throw new ConflictException("Sesi dibatalkan dan tidak dapat difinalisasi.");
    }

    await this.db.transaction(async (tx) => {
      // Find all ACTIVE athletes in the session team
      const activeAthletes = await tx
        .select({ id: athletes.id })
        .from(athletes)
        .where(and(eq(athletes.teamId, session.teamId), eq(athletes.status, "ACTIVE"), isNull(athletes.deletedAt)));

      const existingRecords = await tx
        .select({ athleteId: attendances.athleteId })
        .from(attendances)
        .where(eq(attendances.sessionId, sessionId));

      const existingAthleteIds = new Set(existingRecords.map((r) => r.athleteId));

      const unrecordedAthleteIds = activeAthletes.map((a) => a.id).filter((id) => !existingAthleteIds.has(id));

      if (unrecordedAthleteIds.length > 0) {
        await tx.insert(attendances).values(
          unrecordedAthleteIds.map((athleteId) => ({
            sessionId,
            athleteId,
            status: "ABSENT" as const,
            method: "SYSTEM" as const,
            recordedBy: finalizedByUserId,
          })),
        );
      }

      await tx
        .update(sessions)
        .set({
          status: "COMPLETED",
          finalizedAt: new Date(),
          finalizedBy: finalizedByUserId,
        })
        .where(eq(sessions.id, sessionId));
    });

    return this.getSessionAttendanceSheet(sessionId);
  }

  /**
   * Self check-in by athlete (Hybrid: GPS Geofence or 6-character code):
   * Enforces BR-09 (code/session & window), BR-10 (server time status calculation),
   * BR-11 (duplicate / excuse overwrite), BR-15 (rate limit 5 failed / 10m),
   * and BR-34 (Haversine distance <= session.radiusMeters for GPS check-in).
   */
  async selfCheckin(
    inputOrCode: SelfCheckinInput | string,
    userId: number,
  ): Promise<{
    sessionTitle: string;
    status: AttendanceStatus;
    checkedInAt: Date;
    distanceMeters: number | null;
    message: string;
  }> {
    const payload: SelfCheckinInput = typeof inputOrCode === "string" ? { code: inputOrCode } : inputOrCode;

    // BR-15: Rate limiting on failed code attempts
    if ("code" in payload && this.throttle.isBlocked(userId)) {
      throw new HttpException("Terlalu banyak percobaan, coba lagi nanti.", HttpStatus.TOO_MANY_REQUESTS);
    }

    // Resolve linked active internal athlete
    const [athlete] = await this.db
      .select({
        id: athletes.id,
        teamId: athletes.teamId,
        teamIsInternal: teams.isInternal,
      })
      .from(athletes)
      .innerJoin(teams, eq(athletes.teamId, teams.id))
      .where(and(eq(athletes.userId, userId), eq(athletes.status, "ACTIVE"), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete || !athlete.teamIsInternal) {
      throw new BadRequestException("User tidak tertaut ke atlet aktif tim internal.");
    }

    let session: typeof sessions.$inferSelect | undefined;
    let checkinLatitude: number | null = null;
    let checkinLongitude: number | null = null;
    let checkinDistanceMeters: number | null = null;

    if ("code" in payload) {
      // Mode 2 (Fallback): Find scheduled session with matching 6-character code
      const normalizedCode = payload.code.trim().toUpperCase();
      const [foundSession] = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.teamId, athlete.teamId),
            eq(sessions.status, "SCHEDULED"),
            sql`upper(${sessions.checkinCode}) = ${normalizedCode}`,
            isNull(sessions.deletedAt),
          ),
        )
        .limit(1);

      if (!foundSession) {
        this.throttle.recordFailedAttempt(userId);
        throw new BadRequestException("Kode check-in salah.");
      }
      session = foundSession;
    } else {
      // Mode 1: GPS Geofence Check-in (BR-34)
      const [foundSession] = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, payload.sessionId),
            eq(sessions.teamId, athlete.teamId),
            eq(sessions.status, "SCHEDULED"),
            isNull(sessions.deletedAt),
          ),
        )
        .limit(1);

      if (!foundSession) {
        throw new NotFoundException("Sesi latihan terjadwal tidak ditemukan.");
      }

      if (foundSession.latitude === null || foundSession.longitude === null) {
        throw new BadRequestException(
          "Sesi ini tidak memiliki titik lokasi GPS. Silakan gunakan Kode Check-In 6 karakter.",
        );
      }

      const maxRadius = foundSession.radiusMeters ?? 100;
      const distanceMeters = calculateHaversineDistanceMeters(
        payload.latitude,
        payload.longitude,
        foundSession.latitude,
        foundSession.longitude,
      );

      if (distanceMeters > maxRadius) {
        throw new BadRequestException(
          `Lokasi Anda berada di luar radius presensi (Jarak: ${distanceMeters}m, Maksimal: ${maxRadius}m).`,
        );
      }

      session = foundSession;
      checkinLatitude = payload.latitude;
      checkinLongitude = payload.longitude;
      checkinDistanceMeters = distanceMeters;
    }

    const now = new Date();

    // BR-09: Server time window check: [startsAt - 30 minutes, endsAt]
    const windowStart = new Date(session.startsAt.getTime() - 30 * 60 * 1000);
    const windowEnd = session.endsAt;

    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException("Check-in belum dibuka / sudah ditutup.");
    }

    // Check existing attendance record
    const [existingRecord] = await this.db
      .select()
      .from(attendances)
      .where(and(eq(attendances.sessionId, session.id), eq(attendances.athleteId, athlete.id)))
      .limit(1);

    // BR-11: Reject if already MANUAL or SELF_CHECKIN
    if (existingRecord && (existingRecord.method === "MANUAL" || existingRecord.method === "SELF_CHECKIN")) {
      throw new ConflictException("Kehadiran sudah tercatat.");
    }

    // BR-10: Server determines PRESENT vs LATE based on lateToleranceMinutes
    const toleranceTime = new Date(session.startsAt.getTime() + session.lateToleranceMinutes * 60 * 1000);
    const status: AttendanceStatus = now <= toleranceTime ? "PRESENT" : "LATE";

    // Upsert attendance record
    await this.db
      .insert(attendances)
      .values({
        sessionId: session.id,
        athleteId: athlete.id,
        status,
        method: "SELF_CHECKIN",
        checkedInAt: now,
        checkinLatitude,
        checkinLongitude,
        checkinDistanceMeters,
        recordedBy: userId,
      })
      .onConflictDoUpdate({
        target: [attendances.sessionId, attendances.athleteId],
        set: {
          status,
          method: "SELF_CHECKIN",
          checkedInAt: now,
          checkinLatitude,
          checkinLongitude,
          checkinDistanceMeters,
          note: null, // clear previous excuse reason if any
          recordedBy: userId,
          updatedAt: now,
        },
      });

    // Reset failed counter on success
    if ("code" in payload) {
      this.throttle.reset(userId);
    }

    const message =
      status === "PRESENT"
        ? "Check-in berhasil (Hadir Tepat Waktu)."
        : `Check-in berhasil (Terlambat > ${session.lateToleranceMinutes} menit).`;

    return {
      sessionTitle: session.title,
      status,
      checkedInAt: now,
      distanceMeters: checkinDistanceMeters,
      message,
    };
  }

  /**
   * Submits an excuse request (Izin) for an athlete before session starts:
   * BR-12: Must be before session.startsAt, 5-250 chars reason, doesn't overwrite MANUAL records.
   */
  async submitExcuse(
    sessionId: number,
    reason: string,
    userId: number,
  ): Promise<{ status: AttendanceStatus; message: string }> {
    const [athlete] = await this.db
      .select({
        id: athletes.id,
        teamId: athletes.teamId,
      })
      .from(athletes)
      .where(and(eq(athletes.userId, userId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete) {
      throw new BadRequestException("User tidak tertaut ke profil atlet.");
    }

    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!session) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    if (session.status !== "SCHEDULED") {
      throw new ConflictException("Izin hanya dapat diajukan untuk sesi SCHEDULED.");
    }

    const now = new Date();
    if (now >= session.startsAt) {
      throw new BadRequestException("Izin hanya dapat diajukan sebelum sesi dimulai.");
    }

    const [existingRecord] = await this.db
      .select()
      .from(attendances)
      .where(and(eq(attendances.sessionId, sessionId), eq(attendances.athleteId, athlete.id)))
      .limit(1);

    if (existingRecord && existingRecord.method === "MANUAL") {
      throw new ConflictException("Kehadiran sudah dicatat manual oleh official.");
    }

    await this.db
      .insert(attendances)
      .values({
        sessionId,
        athleteId: athlete.id,
        status: "EXCUSED",
        method: "EXCUSE_REQUEST",
        note: reason.trim(),
        recordedBy: userId,
      })
      .onConflictDoUpdate({
        target: [attendances.sessionId, attendances.athleteId],
        set: {
          status: "EXCUSED",
          method: "EXCUSE_REQUEST",
          note: reason.trim(),
          recordedBy: userId,
          updatedAt: now,
        },
      });

    return {
      status: "EXCUSED",
      message: "Pengajuan izin berhasil dicatat.",
    };
  }

  /**
   * Cancels a submitted excuse request:
   * BR-12: Only allowed before session starts, and only if method is EXCUSE_REQUEST.
   */
  async cancelExcuse(sessionId: number, userId: number): Promise<void> {
    const [athlete] = await this.db
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(eq(athletes.userId, userId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete) {
      throw new BadRequestException("User tidak tertaut ke profil atlet.");
    }

    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .limit(1);

    if (!session) {
      throw new NotFoundException("Sesi tidak ditemukan.");
    }

    const now = new Date();
    if (now >= session.startsAt) {
      throw new BadRequestException("Izin hanya dapat dibatalkan sebelum sesi dimulai.");
    }

    const [existing] = await this.db
      .select()
      .from(attendances)
      .where(and(eq(attendances.sessionId, sessionId), eq(attendances.athleteId, athlete.id)))
      .limit(1);

    if (!existing || existing.method !== "EXCUSE_REQUEST") {
      throw new NotFoundException("Pengajuan izin tidak ditemukan.");
    }

    await this.db
      .delete(attendances)
      .where(and(eq(attendances.sessionId, sessionId), eq(attendances.athleteId, athlete.id)));
  }

  /**
   * Returns personal attendance history and rate for the logged-in athlete (BR-14).
   */
  async getMyAttendanceHistory(userId: number, query: MyAttendanceQuery = {}) {
    const [athlete] = await this.db
      .select({
        id: athletes.id,
        fullName: athletes.fullName,
      })
      .from(athletes)
      .where(and(eq(athletes.userId, userId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete) {
      throw new BadRequestException("User tidak tertaut ke profil atlet.");
    }

    const conditions = [eq(attendances.athleteId, athlete.id), isNull(sessions.deletedAt)];

    if (query.from) {
      conditions.push(gte(sessions.startsAt, new Date(query.from)));
    }
    if (query.to) {
      conditions.push(lte(sessions.endsAt, new Date(query.to)));
    }

    const rows = await this.db
      .select({
        attendance: attendances,
        sessionTitle: sessions.title,
        sessionType: sessions.type,
        sessionStartsAt: sessions.startsAt,
        sessionEndsAt: sessions.endsAt,
        sessionStatus: sessions.status,
      })
      .from(attendances)
      .innerJoin(sessions, eq(attendances.sessionId, sessions.id))
      .where(and(...conditions))
      .orderBy(desc(sessions.startsAt));

    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    for (const r of rows) {
      // Only count completed sessions for attendance rate
      if (r.sessionStatus === "COMPLETED") {
        if (r.attendance.status === "PRESENT") present++;
        else if (r.attendance.status === "LATE") late++;
        else if (r.attendance.status === "EXCUSED") excused++;
        else if (r.attendance.status === "ABSENT") absent++;
      }
    }

    const attendanceRate = computeAttendanceRate({ present, late, excused, absent });

    return {
      athlete: {
        id: athlete.id,
        fullName: athlete.fullName,
      },
      summary: {
        present,
        late,
        excused,
        absent,
        totalCompletedSessions: present + late + excused + absent,
        attendanceRate,
      },
      history: rows.map((r) => ({
        sessionId: r.attendance.sessionId,
        sessionTitle: r.sessionTitle,
        sessionType: r.sessionType,
        sessionStartsAt: r.sessionStartsAt,
        sessionEndsAt: r.sessionEndsAt,
        sessionStatus: r.sessionStatus,
        status: r.attendance.status,
        method: r.attendance.method,
        checkedInAt: r.attendance.checkedInAt,
        checkinDistanceMeters: r.attendance.checkinDistanceMeters ?? null,
        note: r.attendance.note,
      })),
    };
  }

  /**
   * Computes attendance summary per athlete across COMPLETED sessions in date range (BR-13).
   */
  async getAttendanceSummary(query: AttendanceSummaryQuery): Promise<{
    dateRange: { from: string; to: string };
    totalCompletedSessions: number;
    athletes: AthleteAttendanceSummaryItem[];
  }> {
    const fromDate = new Date(`${query.from}T00:00:00+07:00`);
    const toDate = new Date(`${query.to}T23:59:59+07:00`);

    const sessionConditions = [
      eq(sessions.status, "COMPLETED"),
      isNull(sessions.deletedAt),
      gte(sessions.startsAt, fromDate),
      lte(sessions.startsAt, toDate),
    ];

    if (query.type) {
      sessionConditions.push(eq(sessions.type, query.type));
    }

    const completedSessions = await this.db
      .select({ id: sessions.id, startsAt: sessions.startsAt, title: sessions.title })
      .from(sessions)
      .where(and(...sessionConditions))
      .orderBy(asc(sessions.startsAt));

    const sessionIds = completedSessions.map((s) => s.id);

    // Get active internal athletes (or filtered status)
    const athleteConditions = [isNull(athletes.deletedAt)];
    if (query.status) {
      athleteConditions.push(eq(athletes.status, query.status));
    }

    const internalAthletes = await this.db
      .select({
        id: athletes.id,
        fullName: athletes.fullName,
        nickname: athletes.nickname,
        photoUrl: athletes.photoUrl,
        sex: athletes.sex,
        jerseyNumber: athletes.jerseyNumber,
        status: athletes.status,
      })
      .from(athletes)
      .innerJoin(teams, eq(athletes.teamId, teams.id))
      .where(and(eq(teams.isInternal, true), ...athleteConditions))
      .orderBy(asc(athletes.fullName));

    if (sessionIds.length === 0 || internalAthletes.length === 0) {
      return {
        dateRange: { from: query.from, to: query.to },
        totalCompletedSessions: sessionIds.length,
        athletes: internalAthletes.map((a) => ({
          athleteId: a.id,
          fullName: a.fullName,
          nickname: a.nickname,
          photoUrl: a.photoUrl ?? null,
          sex: a.sex,
          jerseyNumber: a.jerseyNumber,
          status: a.status,
          present: 0,
          late: 0,
          excused: 0,
          absent: 0,
          totalSessions: sessionIds.length,
          attendanceRate: null,
        })),
      };
    }

    const attendanceRows = await this.db
      .select({
        athleteId: attendances.athleteId,
        status: attendances.status,
        count: count(),
      })
      .from(attendances)
      .where(inArray(attendances.sessionId, sessionIds))
      .groupBy(attendances.athleteId, attendances.status);

    const countsMap = new Map<number, { present: number; late: number; excused: number; absent: number }>();
    for (const a of internalAthletes) {
      countsMap.set(a.id, { present: 0, late: 0, excused: 0, absent: 0 });
    }

    for (const r of attendanceRows) {
      const counts = countsMap.get(r.athleteId);
      if (!counts) continue;
      const c = Number(r.count);
      if (r.status === "PRESENT") counts.present += c;
      else if (r.status === "LATE") counts.late += c;
      else if (r.status === "EXCUSED") counts.excused += c;
      else if (r.status === "ABSENT") counts.absent += c;
    }

    const resultAthletes: AthleteAttendanceSummaryItem[] = internalAthletes.map((a) => {
      const counts = countsMap.get(a.id) ?? { present: 0, late: 0, excused: 0, absent: 0 };
      const rate = computeAttendanceRate(counts);
      return {
        athleteId: a.id,
        fullName: a.fullName,
        nickname: a.nickname,
        photoUrl: a.photoUrl ?? null,
        sex: a.sex,
        jerseyNumber: a.jerseyNumber,
        status: a.status,
        present: counts.present,
        late: counts.late,
        excused: counts.excused,
        absent: counts.absent,
        totalSessions: sessionIds.length,
        attendanceRate: rate,
      };
    });

    return {
      dateRange: { from: query.from, to: query.to },
      totalCompletedSessions: sessionIds.length,
      athletes: resultAthletes,
    };
  }

  /**
   * Generates a 2-sheet XLSX workbook:
   * Sheet 1: Rekap Presensi (Aggregate totals and rates)
   * Sheet 2: Matriks Presensi (Matrix of athletes x session dates with H/T/I/A codes)
   */
  async buildAttendanceExportWorkbook(query: AttendanceSummaryQuery): Promise<Buffer> {
    const summary = await this.getAttendanceSummary(query);

    const fromDate = new Date(`${query.from}T00:00:00+07:00`);
    const toDate = new Date(`${query.to}T23:59:59+07:00`);

    const sessionConditions = [
      eq(sessions.status, "COMPLETED"),
      isNull(sessions.deletedAt),
      gte(sessions.startsAt, fromDate),
      lte(sessions.startsAt, toDate),
    ];
    if (query.type) {
      sessionConditions.push(eq(sessions.type, query.type));
    }

    const completedSessions = await this.db
      .select({ id: sessions.id, startsAt: sessions.startsAt, title: sessions.title })
      .from(sessions)
      .where(and(...sessionConditions))
      .orderBy(asc(sessions.startsAt));

    // Sheet 1: Rekap Presensi
    const sheet1Rows = summary.athletes.map((a, index) => [
      index + 1,
      a.fullName,
      a.sex === "MALE" ? "L" : "P",
      a.status === "ACTIVE" ? "Aktif" : "Non-aktif",
      a.present,
      a.late,
      a.excused,
      a.absent,
      a.totalSessions,
      a.attendanceRate !== null ? `${a.attendanceRate.toFixed(1)}%` : "—",
    ]);

    const table1 = {
      sheetName: "Rekap Presensi",
      tableName: "RekapPresensi",
      columns: [
        "No.",
        "Nama Atlet",
        "L/P",
        "Status",
        "Hadir (H)",
        "Terlambat (T)",
        "Izin (I)",
        "Absen (A)",
        "Total Sesi",
        "Persentase Kehadiran",
      ],
      rows: sheet1Rows,
    };

    // Sheet 2: Matriks Presensi
    const sessionIds = completedSessions.map((s) => s.id);
    const matrixRecords =
      sessionIds.length > 0
        ? await this.db
            .select({
              sessionId: attendances.sessionId,
              athleteId: attendances.athleteId,
              status: attendances.status,
            })
            .from(attendances)
            .where(inArray(attendances.sessionId, sessionIds))
        : [];

    const matrixMap = new Map<string, AttendanceStatus>();
    for (const r of matrixRecords) {
      matrixMap.set(`${r.athleteId}:${r.sessionId}`, r.status);
    }

    const dateColumns = completedSessions.map((s) => {
      const d = s.startsAt;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    });

    const statusLetter = (status?: AttendanceStatus): string => {
      if (status === "PRESENT") return "H";
      if (status === "LATE") return "T";
      if (status === "EXCUSED") return "I";
      if (status === "ABSENT") return "A";
      return "—";
    };

    const sheet2Rows = summary.athletes.map((a, index) => {
      const row: (string | number)[] = [index + 1, a.fullName];
      for (const s of completedSessions) {
        const st = matrixMap.get(`${a.athleteId}:${s.id}`);
        row.push(statusLetter(st));
      }
      return row;
    });

    const table2 = {
      sheetName: "Matriks Presensi",
      tableName: "MatriksPresensi",
      columns: ["No.", "Nama Atlet", ...dateColumns],
      rows: sheet2Rows,
    };

    return buildWorkbook([table1, table2]);
  }
}
