import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { StatisticsService } from "../statistics.service.js";

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

describe("StatisticsService", () => {
  describe("getPlayerLeaderboard", () => {
    it("returns empty leaderboard if no finished matches exist", async () => {
      // 1. getDefaultTeamId -> [{ id: 1 }]
      // 2. select matches -> []
      const mockDb = createMockDb({
        selectResponses: [
          [{ id: 1 }], // getDefaultTeamId
          [], // finishedMatches
        ],
      });

      const service = new StatisticsService(mockDb as any);
      const res = await service.getPlayerLeaderboard({
        minGp: 1,
        sort: "pts",
        direction: "desc",
        page: 1,
        limit: 50,
      });

      expect(res.data).toEqual([]);
      expect(res.meta.total).toBe(0);
    });

    it("aggregates player statistics correctly from finished matches", async () => {
      const mockMatches = [
        {
          id: 10,
          homeTeamId: 1,
          awayTeamId: 2,
          periodCount: 2,
          periodDurationMinutes: 20,
          matchType: "OFFICIAL",
          matchFormat: "KORFBALL_8",
          scheduledAt: new Date("2026-10-10T10:00:00Z"),
        },
      ];

      const mockTeams = [
        { id: 1, name: "Korfball Bantul" },
        { id: 2, name: "Kab. Klaten" },
      ];

      const mockPlayers = [
        {
          id: 101,
          matchId: 10,
          athleteId: 5,
          side: "HOME",
          jerseyNumber: 10,
          isStarter: true,
          athleteName: "Budi Santoso",
          nickname: "Budi",
          sex: "MALE",
          athleteTeamId: 1,
        },
      ];

      const mockEvents = [
        {
          id: "ev-1",
          seq: 1,
          matchId: 10,
          side: "HOME",
          type: "SHOT_MADE",
          matchPlayerId: 101,
          subInPlayerId: null,
          relatedEventId: null,
          period: 1,
          clockSeconds: 1100,
          shotSector: 2,
          shotDistanceZone: 3,
          note: null,
          deletedAt: null,
        },
        {
          id: "ev-2",
          seq: 2,
          matchId: 10,
          side: "HOME",
          type: "REBOUND_DEF",
          matchPlayerId: 101,
          subInPlayerId: null,
          relatedEventId: null,
          period: 1,
          clockSeconds: 1000,
          shotSector: null,
          shotDistanceZone: null,
          note: null,
          deletedAt: null,
        },
      ];

      const mockDb = createMockDb({
        selectResponses: [
          [{ id: 1 }], // getDefaultTeamId
          mockMatches, // finished matches
          mockTeams, // all teams
          mockPlayers, // playersRaw
          mockEvents, // eventsRaw
        ],
      });

      const service = new StatisticsService(mockDb as any);
      const res = await service.getPlayerLeaderboard({
        minGp: 1,
        sort: "pts",
        direction: "desc",
        page: 1,
        limit: 50,
      });

      expect(res.data.length).toBe(1);
      const p = res.data[0]!;
      expect(p.athleteId).toBe(5);
      expect(p.athleteName).toBe("Budi Santoso");
      expect(p.gp).toBe(1);
      expect(p.sm).toBe(1);
      expect(p.sa).toBe(1); // SHOT_MADE also increments attempt
      expect(p.pts).toBe(1);
      expect(p.dr).toBe(1);
      expect(p.tot).toBe(1);
      // EFF = (SM + RIM + PM + TOT + AS + IT + D) - (SA + RIA + PA - SM - RIM - PM) - TOV
      // = (1 + 0 + 0 + 1 + 0 + 0 + 0) - (1 + 0 + 0 - 1 - 0 - 0) - 0 = 2 - 0 - 0 = 2
      expect(p.eff).toBe(2);
      expect(p.ppg).toBe(1.0);
      expect(p.epg).toBe(2.0);
    });
  });

  describe("getPlayerProfile", () => {
    it("throws NotFoundException if athlete does not exist", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          [], // athlete not found
        ],
      });

      const service = new StatisticsService(mockDb as any);
      await expect(service.getPlayerProfile(999, 1, true)).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when viewing other athlete without full access (BR-29)", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          [
            {
              id: 10,
              fullName: "Lain",
              nickname: "Lain",
              sex: "FEMALE",
              jerseyNumber: 7,
              photoUrl: null,
              teamId: 1,
              status: "ACTIVE",
              userId: 99, // different user
            },
          ],
        ],
      });

      const service = new StatisticsService(mockDb as any);
      // currentUserId = 42, hasFullAccess = false
      await expect(service.getPlayerProfile(10, 42, false)).rejects.toThrow(ForbiddenException);
    });

    it("allows viewing when user owns the athlete profile", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          [
            {
              id: 10,
              fullName: "Saya",
              nickname: "Saya",
              sex: "FEMALE",
              jerseyNumber: 7,
              photoUrl: null,
              teamId: 1,
              status: "ACTIVE",
              userId: 42, // same user
            },
          ],
          [{ name: "Korfball Bantul" }], // team name
          [], // playerMatches (empty for this test)
        ],
      });

      const service = new StatisticsService(mockDb as any);
      const res = await service.getPlayerProfile(10, 42, false);
      expect(res.athlete.id).toBe(10);
      expect(res.athlete.fullName).toBe("Saya");
      expect(res.summary.gp).toBe(0);
      expect(res.gameLogs).toEqual([]);
    });
  });

  describe("getMyStats", () => {
    it("throws NotFoundException if user is not linked to any athlete", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          [], // no athlete with userId
        ],
      });

      const service = new StatisticsService(mockDb as any);
      await expect(service.getMyStats(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getTeamStats", () => {
    it("calculates W/L/D and team aggregate stats correctly", async () => {
      const mockTeam = {
        id: 1,
        name: "Korfball Bantul",
        shortName: "Bantul",
        isInternal: true,
        region: "Bantul",
      };

      const mockMatches = [
        {
          id: 1,
          homeTeamId: 1,
          awayTeamId: 2,
          homeScore: 10,
          awayScore: 8,
          periodCount: 2,
          periodDurationMinutes: 20,
        },
        {
          id: 2,
          homeTeamId: 3,
          awayTeamId: 1,
          homeScore: 12,
          awayScore: 7,
          periodCount: 2,
          periodDurationMinutes: 20,
        },
      ];

      const mockDb = createMockDb({
        selectResponses: [
          [{ id: 1 }], // getDefaultTeamId
          [mockTeam], // team info
          mockMatches, // finished matches
          [], // lineups
          [], // events
        ],
      });

      const service = new StatisticsService(mockDb as any);
      const stats = await service.getTeamStats({});

      expect(stats.team.name).toBe("Korfball Bantul");
      expect(stats.overall.matchesPlayed).toBe(2);
      expect(stats.overall.wins).toBe(1); // 10-8
      expect(stats.overall.losses).toBe(1); // 7-12
      expect(stats.overall.draws).toBe(0);
      expect(stats.overall.winRate).toBe(50.0);
      expect(stats.overall.goalsFor).toBe(17); // 10 + 7
      expect(stats.overall.goalsAgainst).toBe(20); // 8 + 12
      expect(stats.overall.goalDifference).toBe(-3);
    });
  });
});
