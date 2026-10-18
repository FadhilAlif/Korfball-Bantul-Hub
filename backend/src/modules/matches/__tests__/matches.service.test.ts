import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { createMatchSchema, setLineupSchema } from "../matches.schemas.js";
import { MatchesService } from "../matches.service.js";

function createMockDb(
  config: { selectResponses?: unknown[][]; insertReturning?: unknown[]; updateReturning?: unknown[] } = {},
) {
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
    chain.from = vi.fn(() => chain);
    chain.innerJoin = vi.fn(() => chain);
    chain.leftJoin = vi.fn(() => chain);
    chain.where = vi.fn(() => {
      const p = resolveChain() as Promise<unknown> & Record<string, unknown>;
      p.limit = vi.fn(() => p);
      p.orderBy = vi.fn(() => p);
      p.offset = vi.fn(() => p);
      return p;
    });
    chain.limit = vi.fn(() => resolveChain());
    chain.orderBy = vi.fn(() => chain);
    return chain;
  };

  const txMock = {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue(config.insertReturning ?? []),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(config.updateReturning ?? []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  };

  return {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue(config.insertReturning ?? [{ id: 1 }]),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(config.updateReturning ?? [{ id: 1 }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
    transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => {
      return cb(txMock);
    }),
  };
}

describe("MatchesService & Business Rules", () => {
  describe("BR-16: Home and Away validation", () => {
    it("schema rejects homeTeamId === awayTeamId for OFFICIAL match", () => {
      const parsed = createMatchSchema.safeParse({
        type: "OFFICIAL",
        format: "K8",
        homeTeamId: 1,
        awayTeamId: 1,
        scheduledAt: new Date(),
      });
      expect(parsed.success).toBe(false);
    });

    it("schema allows homeTeamId === awayTeamId for SCRIMMAGE match", () => {
      const parsed = createMatchSchema.safeParse({
        type: "SCRIMMAGE",
        format: "K8",
        homeTeamId: 1,
        awayTeamId: 1,
        scheduledAt: new Date(),
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("BR-17: Lineup validation", () => {
    it("schema validates player jersey 0-99", () => {
      expect(
        setLineupSchema.safeParse({
          side: "HOME",
          players: [{ athleteId: 1, jerseyNumber: 100, isStarter: true }],
        }).success,
      ).toBe(false);

      expect(
        setLineupSchema.safeParse({
          side: "HOME",
          players: [{ athleteId: 1, jerseyNumber: 12, isStarter: true }],
        }).success,
      ).toBe(true);
    });

    it("throws ConflictException if match is FINISHED (BR-25)", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // 1. match query
          [{ id: 1, status: "FINISHED", deletedAt: null }],
        ],
      });
      const service = new MatchesService(mockDb as never);

      await expect(
        service.setLineup(1, { side: "HOME", players: [{ athleteId: 1, jerseyNumber: 10, isStarter: true }] }, 1),
      ).rejects.toThrow(ConflictException);
    });

    it("throws BadRequestException if athlete does not belong to side team", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // 1. match query: homeTeamId is 10
          [{ id: 1, homeTeamId: 10, awayTeamId: 20, status: "SCHEDULED", deletedAt: null }],
          // 2. athlete query: athlete has teamId 99 (different team!)
          [{ id: 5, teamId: 99, fullName: "Budi", status: "ACTIVE" }],
        ],
      });
      const service = new MatchesService(mockDb as never);

      await expect(
        service.setLineup(1, { side: "HOME", players: [{ athleteId: 5, jerseyNumber: 10, isStarter: true }] }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ConflictException if athlete is already on opposite side", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // 1. match
          [{ id: 1, homeTeamId: 10, awayTeamId: 20, status: "SCHEDULED", deletedAt: null }],
          // 2. athlete
          [{ id: 5, teamId: 10, fullName: "Budi", status: "ACTIVE" }],
          // 3. opposite side lineup (AWAY has athleteId 5)
          [{ athleteId: 5 }],
        ],
      });
      const service = new MatchesService(mockDb as never);

      await expect(
        service.setLineup(1, { side: "HOME", players: [{ athleteId: 5, jerseyNumber: 10, isStarter: true }] }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("BR-18: Starter composition validation on Start", () => {
    it("blocks OFFICIAL match when K8 starters are not 4L and 4P", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // 1. getMatch: match query
          [{ id: 1, type: "OFFICIAL", format: "K8", periodDurationMinutes: 25, status: "SCHEDULED", deletedAt: null }],
          // homeTeam
          [{ id: 1, name: "Home" }],
          // awayTeam
          [{ id: 2, name: "Away" }],
          // lineup: Home has only 2 males and 2 females (4 starters instead of 8)
          [
            { id: 1, athleteId: 1, side: "HOME", isStarter: true, sex: "MALE" },
            { id: 2, athleteId: 2, side: "HOME", isStarter: true, sex: "MALE" },
            { id: 3, athleteId: 3, side: "HOME", isStarter: true, sex: "FEMALE" },
            { id: 4, athleteId: 4, side: "HOME", isStarter: true, sex: "FEMALE" },
          ],
          // activeEvents
          [],
        ],
      });
      const service = new MatchesService(mockDb as never);

      await expect(service.startMatch(1, { force: false }, 1)).rejects.toThrow(BadRequestException);
    });

    it("requires force: true for SCRIMMAGE when starters do not match standard", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // getMatch
          [{ id: 1, type: "SCRIMMAGE", format: "K8", periodDurationMinutes: 25, status: "SCHEDULED", deletedAt: null }],
          [{ id: 1, name: "Home" }],
          [{ id: 2, name: "Away" }],
          [{ id: 1, athleteId: 1, side: "HOME", isStarter: true, sex: "MALE" }],
          [],
        ],
      });
      const service = new MatchesService(mockDb as never);

      // force = false should warn/reject
      await expect(service.startMatch(1, { force: false }, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe("BR-19 & BR-25: Match Status and Event Constraints", () => {
    it("rejects event recording if match is not LIVE (BR-19)", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // getMatch: status SCHEDULED
          [{ id: 1, type: "SCRIMMAGE", format: "K8", status: "SCHEDULED", deletedAt: null }],
          [{ id: 1, name: "Home" }],
          [{ id: 2, name: "Away" }],
          [],
          [],
        ],
      });
      const service = new MatchesService(mockDb as never);

      await expect(
        service.recordEventsBatch(
          1,
          {
            events: [
              {
                id: "550e8400-e29b-41d4-a716-446655440000",
                side: "HOME",
                type: "SHOT_MADE",
                period: 1,
                clockSeconds: 500,
                clientRecordedAt: new Date(),
              },
            ],
          },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it("reopens FINISHED match and sets status back to LIVE (BR-25)", async () => {
      const mockDb = createMockDb({
        selectResponses: [
          // 1. check match
          [{ id: 1, status: "FINISHED", deletedAt: null }],
          // 2. getMatch reload
          [{ id: 1, status: "LIVE", deletedAt: null }],
          [{ id: 1, name: "Home" }],
          [{ id: 2, name: "Away" }],
          [],
          [],
        ],
      });
      const service = new MatchesService(mockDb as never);

      const result = await service.reopenMatch(1, 1);
      expect(result.status).toBe("LIVE");
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
