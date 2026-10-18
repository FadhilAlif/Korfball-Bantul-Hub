import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user.type.js";
import { DashboardService } from "../dashboard.service.js";

function createMockDb(config: { selectResponses?: unknown[][] } = {}) {
  let selectIndex = 0;
  const selectResponses = config.selectResponses ?? [];

  const nextSelect = () => {
    const res = selectResponses[selectIndex] ?? [];
    selectIndex++;
    return res;
  };

  const makeSelectChain = () => {
    const chain: Record<string, unknown> = {};
    const resolveChain = () => Promise.resolve(nextSelect());
    // biome-ignore lint/suspicious/noThenProperty: mock thenable for Drizzle query builder
    chain.then = (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      resolveChain().then(onFulfilled, onRejected);
    chain.from = vi.fn(() => chain);
    chain.innerJoin = vi.fn(() => chain);
    chain.leftJoin = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.offset = vi.fn(() => chain);
    return chain;
  };

  return {
    select: vi.fn(() => makeSelectChain()),
  };
}

describe("DashboardService - getDashboardSummary", () => {
  it("returns staff dashboard summary with team attendance and rekap", async () => {
    const staffUser: AuthenticatedUser = {
      id: 1,
      email: "coach@korfballbantul.id",
      roles: ["coach"],
      permissions: ["sessions:read", "attendance:record", "stats:read"],
    };

    const mockInternalTeam = [{ id: 1, name: "Korfball Bantul" }];
    const mockAllTeams = [
      { id: 1, name: "Korfball Bantul" },
      { id: 2, name: "Kab. Klaten" },
    ];
    const mockTodaySession = [
      {
        id: 10,
        title: "Latihan Rutin Selasa",
        sessionType: "TRAINING_ROUTINE",
        status: "SCHEDULED",
        startsAt: new Date("2026-10-20T18:00:00Z"),
        endsAt: new Date("2026-10-20T20:00:00Z"),
        venue: "GOR Sasana Krida Bantul",
        checkinCode: "KORF12",
      },
    ];
    const mockUpcomingSessions = [
      {
        id: 11,
        title: "Latihan Rutin Sabtu",
        sessionType: "TRAINING_ROUTINE",
        status: "SCHEDULED",
        startsAt: new Date("2026-10-24T19:00:00Z"),
        endsAt: new Date("2026-10-24T21:00:00Z"),
        venue: "GOR Sasana Krida Bantul",
      },
    ];
    const mockLiveMatch = [
      {
        id: 5,
        scheduledAt: new Date("2026-10-20T15:00:00Z"),
        matchType: "OFFICIAL",
        matchFormat: "KORFBALL_8",
        venue: "Lapangan 1",
        status: "LIVE",
        currentPeriod: 2,
        homeTeamId: 1,
        awayTeamId: 2,
        homeScore: 8,
        awayScore: 6,
      },
    ];
    const mockAttList = [{ status: "PRESENT" }, { status: "LATE" }, { status: "ABSENT" }];
    const mockFinished90d = [
      {
        id: 1,
        homeTeamId: 1,
        awayTeamId: 2,
        homeScore: 10,
        awayScore: 8,
      },
    ];
    const mockActiveAthletesCount = [{ count: 18 }];
    const mockRecentMatches = [
      {
        id: 1,
        scheduledAt: new Date("2026-10-15T15:00:00Z"),
        matchType: "OFFICIAL",
        homeTeamId: 1,
        awayTeamId: 2,
        homeScore: 10,
        awayScore: 8,
      },
    ];

    const mockDb = createMockDb({
      selectResponses: [
        mockInternalTeam,
        mockAllTeams,
        mockTodaySession,
        mockUpcomingSessions,
        mockLiveMatch,
        mockAttList,
        mockFinished90d,
        mockActiveAthletesCount,
        mockRecentMatches,
      ],
    });

    const mockStatsService = {} as any;
    const service = new DashboardService(mockDb as any, mockStatsService);

    const summary = await service.getDashboardSummary(staffUser);

    expect(summary.role).toBe("staff");
    expect(summary.todaySession).toBeDefined();
    expect(summary.todaySession.checkinCode).toBe("KORF12");
    expect(summary.upcomingSessions.length).toBe(1);
    expect(summary.activeOrUpcomingMatch).toBeDefined();
    expect(summary.activeOrUpcomingMatch.status).toBe("LIVE");
    // 2 present (PRESENT + LATE) / 3 total = 66.7%
    expect(summary.attendanceRate30d).toBe(66.7);
    expect(summary.teamSummary90d).toEqual({
      matchesCount: 1,
      wins: 1,
      losses: 0,
      draws: 0,
      winRate: 100,
      goalsFor: 10,
      goalsAgainst: 8,
    });
    expect(summary.activeAthletesCount).toBe(18);
    expect(summary.recentMatches.length).toBe(1);
  });

  it("returns athlete dashboard summary with personal attendance and stats", async () => {
    const athleteUser: AuthenticatedUser = {
      id: 5,
      email: "athlete@korfballbantul.id",
      roles: ["athlete"],
      permissions: ["attendance:self", "stats:read_own"],
      athlete: {
        id: 12,
        fullName: "Rukmi",
        nickname: "Rukmi",
        sex: "FEMALE",
        jerseyNumber: 1,
        teamId: 1,
      },
    };

    const mockInternalTeam = [{ id: 1, name: "Korfball Bantul" }];
    const mockAllTeams = [{ id: 1, name: "Korfball Bantul" }];
    const mockTodaySession = [
      {
        id: 10,
        title: "Latihan Rutin Selasa",
        sessionType: "TRAINING_ROUTINE",
        status: "SCHEDULED",
        startsAt: new Date("2026-10-20T18:00:00Z"),
        endsAt: new Date("2026-10-20T20:00:00Z"),
        venue: "GOR Sasana Krida Bantul",
        checkinCode: "SECRET",
      },
    ];
    const mockMyAttendance = [
      {
        status: "PRESENT",
        recordedMethod: "SELF_CHECKIN",
        checkedInAt: new Date("2026-10-20T17:50:00Z"),
        notes: null,
      },
    ];
    const mockUpcomingSessions: any[] = [];
    const mockLiveMatch: any[] = [];
    const mockClosestScheduled: any[] = [];
    const mockAttList = [{ status: "PRESENT" }];
    const mockRecentMatches: any[] = [];

    const mockDb = createMockDb({
      selectResponses: [
        mockInternalTeam,
        mockAllTeams,
        mockTodaySession,
        mockMyAttendance,
        mockUpcomingSessions,
        mockLiveMatch,
        mockClosestScheduled,
        mockAttList,
        mockRecentMatches,
      ],
    });

    const mockStatsService = {
      getPlayerProfile: vi.fn().mockResolvedValue({
        summary: {
          gp: 4,
          pts: 8,
          pctFgTotal: 50.0,
          epg: 3.5,
        },
      }),
    };

    const service = new DashboardService(mockDb as any, mockStatsService as any);
    const summary = await service.getDashboardSummary(athleteUser);

    expect(summary.role).toBe("athlete");
    expect(summary.todaySession.checkinCode).toBeUndefined(); // hidden from athlete
    expect(summary.todaySession.myAttendance.status).toBe("PRESENT");
    expect(summary.attendanceRate30d).toBe(100);
    expect(summary.teamSummary90d).toBeUndefined(); // hidden from athlete
    expect(summary.activeAthletesCount).toBeUndefined(); // hidden from athlete
    expect(summary.myStats).toEqual({
      gp: 4,
      pts: 8,
      fgPct: 50.0,
      avgEff: 3.5,
    });
  });
});
