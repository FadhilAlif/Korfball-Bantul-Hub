import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, gt, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type.js";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import {
  athletes,
  attendances,
  auditLogs,
  matches,
  permissions,
  rolePermissions,
  roles,
  sessions,
  teams,
  userRoles,
  users,
} from "../../database/schema/index.js";
import { buildWorkbook } from "../../lib/exporters/table-workbook.js";
import { parseWibDateRange } from "../sessions/sessions.utils.js";
import { StatisticsService } from "../statistics/statistics.service.js";

const STATS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface RoleDistributionItem {
  id: number;
  name: string;
  count: number;
  pct: number;
}

export interface DashboardStatsDto {
  totalUsers: number;
  newUsersThisWeek: number;
  inactiveUsers: number;
  totalRoles: number;
  totalPermissionsAssigned: number;
  totalPermissions: number;
  totalEvents: number;
  eventsToday: number;
  recentActivity: {
    id: number;
    action: string;
    resourceType: string;
    resourceId: number | null;
    userName: string | null;
    createdAt: string;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase,
    @Inject(StatisticsService) private readonly statisticsService: StatisticsService,
  ) {}

  async getRoleDistribution(): Promise<RoleDistributionItem[]> {
    const [totalUsersRes] = await this.db.select({ count: count() }).from(users).where(isNull(users.deletedAt));

    const totalUsers = totalUsersRes?.count ? Number(totalUsersRes.count) : 0;

    const allRoles = await this.db.select({ id: roles.id, name: roles.name }).from(roles).orderBy(roles.name).limit(6);

    const items = await Promise.all(
      allRoles.map(async (r) => {
        const [c] = await this.db.select({ count: count() }).from(userRoles).where(eq(userRoles.roleId, r.id));

        const roleCount = c?.count ? Number(c.count) : 0;
        return {
          id: r.id,
          name: r.name,
          count: roleCount,
          pct: totalUsers > 0 ? Math.round((roleCount / totalUsers) * 100) : 0,
        };
      }),
    );

    return items;
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const sinceDate = new Date(Date.now() - STATS_WINDOW_MS);
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      totalUsersRes,
      inactiveUsersRes,
      newUsersThisWeekRes,
      totalRolesRes,
      totalPermissionsAssignedRes,
      totalPermissionsRes,
      totalEventsRes,
      eventsTodayRes,
      recentLogs,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),
      this.db
        .select({ count: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), eq(users.isActive, false))),
      this.db
        .select({ count: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), gte(users.createdAt, sinceDate))),
      this.db.select({ count: count() }).from(roles),
      this.db.select({ count: count() }).from(rolePermissions),
      this.db.select({ count: count() }).from(permissions),
      this.db.select({ count: count() }).from(auditLogs),
      this.db.select({ count: count() }).from(auditLogs).where(gte(auditLogs.createdAt, todayMidnight)),
      this.db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          userName: users.fullName,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20),
    ]);

    return {
      totalUsers: totalUsersRes[0]?.count ? Number(totalUsersRes[0].count) : 0,
      inactiveUsers: inactiveUsersRes[0]?.count ? Number(inactiveUsersRes[0].count) : 0,
      newUsersThisWeek: newUsersThisWeekRes[0]?.count ? Number(newUsersThisWeekRes[0].count) : 0,
      totalRoles: totalRolesRes[0]?.count ? Number(totalRolesRes[0].count) : 0,
      totalPermissionsAssigned: totalPermissionsAssignedRes[0]?.count
        ? Number(totalPermissionsAssignedRes[0].count)
        : 0,
      totalPermissions: totalPermissionsRes[0]?.count ? Number(totalPermissionsRes[0].count) : 0,
      totalEvents: totalEventsRes[0]?.count ? Number(totalEventsRes[0].count) : 0,
      eventsToday: eventsTodayRes[0]?.count ? Number(eventsTodayRes[0].count) : 0,
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        userName: log.userName,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  async buildExportWorkbook(): Promise<Buffer> {
    const stats = await this.getDashboardStats();

    return buildWorkbook([
      {
        sheetName: "Overview",
        tableName: "Overview",
        columns: ["Metric", "Value"],
        rows: [
          ["Total Users", stats.totalUsers],
          ["Active Users", stats.totalUsers - stats.inactiveUsers],
          ["Inactive Users", stats.inactiveUsers],
          ["New Users (This Week)", stats.newUsersThisWeek],
          ["Total Roles", stats.totalRoles],
          ["Total Permissions", stats.totalPermissions],
          ["Assigned Permissions", stats.totalPermissionsAssigned],
          ["Total Audit Events", stats.totalEvents],
          ["Events Today", stats.eventsToday],
        ],
      },
    ]);
  }

  /**
   * Role-aware dashboard summary (PRD §5.1).
   */
  async getDashboardSummary(user: AuthenticatedUser) {
    const isStaff =
      user.roles?.includes("admin") ||
      user.roles?.includes("coach") ||
      user.permissions?.some((p) => ["matches:record", "attendance:record", "stats:read"].includes(p));

    // Resolve linked athlete ID for the user if not already attached to user object
    let athleteId = user.athlete?.id;
    if (!athleteId && !isStaff) {
      const [linkedAthlete] = await this.db
        .select({ id: athletes.id })
        .from(athletes)
        .where(and(eq(athletes.userId, user.id), isNull(athletes.deletedAt)))
        .limit(1);
      if (linkedAthlete) {
        athleteId = linkedAthlete.id;
      }
    }

    // 1. Get internal team
    const [internalTeam] = await this.db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.isInternal, true), isNull(teams.deletedAt)))
      .limit(1);

    const internalTeamId = internalTeam?.id ?? 1;

    // 2. Fetch team map
    const allTeams = await this.db.select({ id: teams.id, name: teams.name }).from(teams);
    const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

    const now = new Date();
    // Compute current day window in WIB (UTC+7)
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibNow = new Date(now.getTime() + wibOffset);
    const y = wibNow.getUTCFullYear();
    const m = wibNow.getUTCMonth();
    const d = wibNow.getUTCDate();
    const startOfDayUtc = new Date(Date.UTC(y, m, d, 0, 0, 0) - wibOffset);
    const endOfDayUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - wibOffset);

    // 3. Sesi Hari Ini
    const [todaySessionRow] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.teamId, internalTeamId),
          gte(sessions.startsAt, startOfDayUtc),
          lte(sessions.startsAt, endOfDayUtc),
          isNull(sessions.deletedAt),
          ne(sessions.status, "CANCELLED"),
        ),
      )
      .orderBy(sessions.startsAt)
      .limit(1);

    let todaySession: any = null;
    if (todaySessionRow) {
      let myAttendance: any = null;
      if (!isStaff && athleteId) {
        const [att] = await this.db
          .select()
          .from(attendances)
          .where(and(eq(attendances.sessionId, todaySessionRow.id), eq(attendances.athleteId, athleteId)))
          .limit(1);

        if (att) {
          myAttendance = {
            status: att.status,
            recordedMethod: att.method,
            checkedInAt: att.checkedInAt?.toISOString() ?? null,
            notes: att.note,
          };
        }
      }

      todaySession = {
        id: todaySessionRow.id,
        title: todaySessionRow.title,
        sessionType: todaySessionRow.type,
        status: todaySessionRow.status,
        startsAt: todaySessionRow.startsAt.toISOString(),
        endsAt: todaySessionRow.endsAt.toISOString(),
        venue: todaySessionRow.venue,
        checkinCode: isStaff ? todaySessionRow.checkinCode : undefined,
        myAttendance,
      };
    }

    // 4. Sesi Berikutnya (max 5 upcoming scheduled sessions)
    const upcomingSessionsRows = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.teamId, internalTeamId),
          gt(sessions.startsAt, now),
          eq(sessions.status, "SCHEDULED"),
          isNull(sessions.deletedAt),
        ),
      )
      .orderBy(sessions.startsAt)
      .limit(5);

    const upcomingSessions = upcomingSessionsRows.map((s) => ({
      id: s.id,
      title: s.title,
      sessionType: s.type,
      status: s.status,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      venue: s.venue,
    }));

    // 5. Match Live / Berikutnya
    const [liveMatch] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.status, "LIVE"), isNull(matches.deletedAt)))
      .orderBy(matches.scheduledAt)
      .limit(1);

    let activeOrUpcomingMatch: any = null;
    if (liveMatch) {
      activeOrUpcomingMatch = {
        id: liveMatch.id,
        scheduledAt: liveMatch.scheduledAt.toISOString(),
        matchType: liveMatch.type,
        matchFormat: liveMatch.format,
        venue: liveMatch.venue,
        status: liveMatch.status,
        currentPeriod: liveMatch.currentPeriod,
        homeTeamId: liveMatch.homeTeamId,
        homeTeamName: teamMap.get(liveMatch.homeTeamId) ?? "Home",
        awayTeamId: liveMatch.awayTeamId,
        awayTeamName: teamMap.get(liveMatch.awayTeamId) ?? "Away",
        homeScore: liveMatch.homeScore,
        awayScore: liveMatch.awayScore,
      };
    } else {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const [closestMatch] = await this.db
        .select()
        .from(matches)
        .where(and(eq(matches.status, "SCHEDULED"), gte(matches.scheduledAt, twoHoursAgo), isNull(matches.deletedAt)))
        .orderBy(matches.scheduledAt)
        .limit(1);

      if (closestMatch) {
        activeOrUpcomingMatch = {
          id: closestMatch.id,
          scheduledAt: closestMatch.scheduledAt.toISOString(),
          matchType: closestMatch.type,
          matchFormat: closestMatch.format,
          venue: closestMatch.venue,
          status: closestMatch.status,
          currentPeriod: closestMatch.currentPeriod,
          homeTeamId: closestMatch.homeTeamId,
          homeTeamName: teamMap.get(closestMatch.homeTeamId) ?? "Home",
          awayTeamId: closestMatch.awayTeamId,
          awayTeamName: teamMap.get(closestMatch.awayTeamId) ?? "Away",
          homeScore: closestMatch.homeScore,
          awayScore: closestMatch.awayScore,
        };
      }
    }

    // 6. Kehadiran 30 Hari (BR-13)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let attendanceRate30d: number | null = null;

    if (isStaff) {
      const attList = await this.db
        .select({ status: attendances.status })
        .from(attendances)
        .innerJoin(sessions, eq(attendances.sessionId, sessions.id))
        .where(
          and(
            eq(sessions.teamId, internalTeamId),
            eq(sessions.status, "COMPLETED"),
            gte(sessions.startsAt, thirtyDaysAgo),
            isNull(sessions.deletedAt),
          ),
        );

      let presentCount = 0;
      let totalEligible = 0;
      for (const a of attList) {
        if (a.status === "PRESENT" || a.status === "LATE") {
          presentCount++;
          totalEligible++;
        } else if (a.status === "EXCUSED" || a.status === "ABSENT") {
          totalEligible++;
        }
      }
      attendanceRate30d = totalEligible > 0 ? Number(((presentCount / totalEligible) * 100).toFixed(1)) : null;
    } else if (athleteId) {
      const attList = await this.db
        .select({ status: attendances.status })
        .from(attendances)
        .innerJoin(sessions, eq(attendances.sessionId, sessions.id))
        .where(
          and(
            eq(attendances.athleteId, athleteId),
            eq(sessions.status, "COMPLETED"),
            gte(sessions.startsAt, thirtyDaysAgo),
            isNull(sessions.deletedAt),
          ),
        );

      let presentCount = 0;
      let totalEligible = 0;
      for (const a of attList) {
        if (a.status === "PRESENT" || a.status === "LATE") {
          presentCount++;
          totalEligible++;
        } else if (a.status === "EXCUSED" || a.status === "ABSENT") {
          totalEligible++;
        }
      }
      attendanceRate30d = totalEligible > 0 ? Number(((presentCount / totalEligible) * 100).toFixed(1)) : null;
    }

    // 7. Staff: Rekap Tim 90 Hari & Active Athletes Count
    let teamSummary90d: any;
    let activeAthletesCount: number | undefined;

    if (isStaff) {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const finished90d = await this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, "FINISHED"),
            gte(matches.scheduledAt, ninetyDaysAgo),
            or(eq(matches.homeTeamId, internalTeamId), eq(matches.awayTeamId, internalTeamId))!,
            isNull(matches.deletedAt),
          ),
        );

      let w = 0;
      let l = 0;
      let d = 0;
      let gf = 0;
      let ga = 0;
      let externalCount = 0;

      for (const match of finished90d) {
        const isInternalScrimmage = match.homeTeamId === internalTeamId && match.awayTeamId === internalTeamId;
        if (!isInternalScrimmage) {
          externalCount++;
          const isHome = match.homeTeamId === internalTeamId;
          const myScore = isHome ? match.homeScore : match.awayScore;
          const oppScore = isHome ? match.awayScore : match.homeScore;
          if (myScore > oppScore) w++;
          else if (myScore < oppScore) l++;
          else d++;
          gf += myScore;
          ga += oppScore;
        }
      }

      teamSummary90d = {
        matchesCount: externalCount,
        wins: w,
        losses: l,
        draws: d,
        winRate: externalCount > 0 ? Number(((w / externalCount) * 100).toFixed(1)) : 0,
        goalsFor: gf,
        goalsAgainst: ga,
      };

      const [activeRes] = await this.db
        .select({ count: count() })
        .from(athletes)
        .where(and(eq(athletes.teamId, internalTeamId), eq(athletes.status, "ACTIVE"), isNull(athletes.deletedAt)));
      activeAthletesCount = activeRes?.count ? Number(activeRes.count) : 0;
    }

    // 8. Athlete: Statistik Saya
    let myStats: any;
    if (!isStaff && athleteId) {
      try {
        const profile = await this.statisticsService.getPlayerProfile(athleteId, user.id, true);
        myStats = {
          gp: profile.summary.gp,
          pts: profile.summary.pts,
          fgPct: profile.summary.pctFgTotal,
          avgEff: profile.summary.epg,
        };
      } catch {
        myStats = {
          gp: 0,
          pts: 0,
          fgPct: null,
          avgEff: 0,
        };
      }
    } else if (!isStaff) {
      myStats = {
        gp: 0,
        pts: 0,
        fgPct: null,
        avgEff: 0,
      };
    }

    // 9. Hasil Terakhir (last 5 finished matches)
    const recentMatchesRows = await this.db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.status, "FINISHED"),
          or(eq(matches.homeTeamId, internalTeamId), eq(matches.awayTeamId, internalTeamId))!,
          isNull(matches.deletedAt),
        ),
      )
      .orderBy(desc(matches.scheduledAt))
      .limit(6);

    const recentMatches = recentMatchesRows.map((m) => {
      const isHome = m.homeTeamId === internalTeamId;
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const opponentScore = isHome ? m.awayScore : m.homeScore;
      const opponentName = isHome ? (teamMap.get(m.awayTeamId) ?? "Lawan") : (teamMap.get(m.homeTeamId) ?? "Lawan");
      const result: "W" | "L" | "D" = teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "D";

      return {
        id: m.id,
        scheduledAt: m.scheduledAt.toISOString(),
        matchType: m.type,
        homeTeamName: teamMap.get(m.homeTeamId) ?? "Home",
        awayTeamName: teamMap.get(m.awayTeamId) ?? "Away",
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        teamScore,
        opponentScore,
        opponentName,
        result,
      };
    });

    // 10. Tren Presensi Latihan (Last 6 completed sessions default)
    const attendanceTrend = await this.getAttendanceTrend(user);

    // 11. Akurasi & Distribusi Tembakan Tim (Shot Distribution)
    let teamShooting: {
      rim: number;
      ria: number;
      pctFgr: number | null;
      sm: number;
      sa: number;
      pctFgs: number | null;
      pm: number;
      pa: number;
      pctP: number | null;
      totalMade: number;
      totalAttempts: number;
      pctFg: number | null;
    } | null = null;

    try {
      const teamStats = await this.statisticsService.getTeamStats({ teamId: internalTeamId });
      teamShooting = {
        rim: teamStats.shooting.rim,
        ria: teamStats.shooting.ria,
        pctFgr: teamStats.shooting.pctFgr,
        sm: teamStats.shooting.sm,
        sa: teamStats.shooting.sa,
        pctFgs: teamStats.shooting.pctFgs,
        pm: teamStats.shooting.pm,
        pa: teamStats.shooting.pa,
        pctP: teamStats.shooting.pctP,
        totalMade: teamStats.shooting.rim + teamStats.shooting.sm + teamStats.shooting.pm,
        totalAttempts: teamStats.shooting.ria + teamStats.shooting.sa + teamStats.shooting.pa,
        pctFg: teamStats.shooting.pctFgTotal,
      };
    } catch {
      teamShooting = null;
    }

    return {
      role: isStaff ? "staff" : "athlete",
      internalTeamId,
      internalTeamName: internalTeam?.name ?? "Korfball Bantul",
      todaySession,
      upcomingSessions,
      activeOrUpcomingMatch,
      attendanceRate30d,
      activeAthletesCount,
      teamSummary90d,
      myStats,
      recentMatches,
      attendanceTrend,
      teamShooting,
    };
  }

  /**
   * Mengambil data tren kehadiran sesi latihan (bisa difilter berdasarkan from & to date).
   */
  async getAttendanceTrend(
    user: AuthenticatedUser,
    from?: string,
    to?: string,
  ): Promise<
    {
      sessionId: number;
      sessionTitle: string;
      date: string;
      present: number;
      late: number;
      excused: number;
      absent: number;
      rate: number;
    }[]
  > {
    let internalTeamId = 1;
    const [internalTeam] = await this.db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.isInternal, true), isNull(teams.deletedAt)))
      .limit(1);

    if (internalTeam) {
      internalTeamId = internalTeam.id;
    }

    const sessionConditions = [
      eq(sessions.teamId, internalTeamId),
      eq(sessions.status, "COMPLETED"),
      isNull(sessions.deletedAt),
    ];

    const { fromDate, toDate } = parseWibDateRange(from, to);
    if (fromDate) {
      sessionConditions.push(gte(sessions.startsAt, fromDate));
    }
    if (toDate) {
      sessionConditions.push(lte(sessions.startsAt, toDate));
    }

    const recentCompletedSessions = await this.db
      .select({
        id: sessions.id,
        title: sessions.title,
        startsAt: sessions.startsAt,
      })
      .from(sessions)
      .where(and(...sessionConditions))
      .orderBy(desc(sessions.startsAt))
      .limit(fromDate || toDate ? 20 : 6);

    const sessionIds = recentCompletedSessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return [];
    }

    const attRows = await this.db
      .select({
        sessionId: attendances.sessionId,
        status: attendances.status,
        count: count(),
      })
      .from(attendances)
      .where(inArray(attendances.sessionId, sessionIds))
      .groupBy(attendances.sessionId, attendances.status);

    const map = new Map<number, { present: number; late: number; excused: number; absent: number; total: number }>();
    for (const id of sessionIds) {
      map.set(id, { present: 0, late: 0, excused: 0, absent: 0, total: 0 });
    }
    for (const row of attRows) {
      const item = map.get(row.sessionId);
      if (!item) continue;
      const c = Number(row.count);
      item.total += c;
      if (row.status === "PRESENT") item.present += c;
      else if (row.status === "LATE") item.late += c;
      else if (row.status === "EXCUSED") item.excused += c;
      else if (row.status === "ABSENT") item.absent += c;
    }

    return recentCompletedSessions
      .map((s) => {
        const item = map.get(s.id) ?? { present: 0, late: 0, excused: 0, absent: 0, total: 0 };
        const start = new Date(s.startsAt);
        const dateLabel = new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          timeZone: "Asia/Jakarta",
        }).format(start);
        const attended = item.present + item.late;
        return {
          sessionId: s.id,
          sessionTitle: s.title,
          date: dateLabel,
          present: item.present,
          late: item.late,
          excused: item.excused,
          absent: item.absent,
          rate: item.total > 0 ? Number(((attended / item.total) * 100).toFixed(1)) : 0,
        };
      })
      .reverse();
  }
}
