import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { createTeamSchema } from "../teams.schemas.js";
import { TeamsService } from "../teams.service.js";

function createMockDb(selectResponses: unknown[][] = []) {
  let callIndex = 0;
  const nextResult = () => {
    const res = selectResponses[callIndex] ?? [];
    callIndex++;
    return res;
  };

  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    const resolveChain = () => Promise.resolve(nextResult());
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => {
      const p = resolveChain() as Promise<unknown> & Record<string, unknown>;
      p.limit = vi.fn(() => p);
      p.orderBy = vi.fn(() => p);
      p.offset = vi.fn(() => p);
      return p;
    });
    chain.limit = vi.fn(() => resolveChain());
    return chain;
  };

  return {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: 10,
            name: "Kab. Sleman",
            shortName: "SLEMAN",
            isInternal: false,
            region: "Sleman",
            color: "#3B82F6",
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };
}

describe("TeamsService & Schemas", () => {
  it("validates createTeamSchema fields properly", () => {
    expect(createTeamSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(
      createTeamSchema.safeParse({
        name: "Korfball Bantul",
        shortName: "BANTUL",
        isInternal: true,
        color: "#FACC15",
      }).success,
    ).toBe(true);
    expect(
      createTeamSchema.safeParse({
        name: "Tim Warna Salah",
        color: "yellow",
      }).success,
    ).toBe(false);
  });

  it("throws ConflictException when creating a team with a duplicate name", async () => {
    const mockDb = createMockDb([[{ id: 1 }]]);
    const service = new TeamsService(mockDb as never);

    await expect(service.createTeam({ name: "Korfball Bantul", isInternal: true })).rejects.toThrow(ConflictException);
  });

  it("throws ConflictException (BR-03) when deleting a team that has athletes or match history", async () => {
    const mockDb = createMockDb([
      [{ id: 1, name: "Korfball Bantul" }], // existing team
      [{ count: 5 }], // athletes count > 0
      [{ count: 0 }], // sessions count
      [{ count: 0 }], // matches count
    ]);
    const service = new TeamsService(mockDb as never);

    await expect(service.deleteTeam(1)).rejects.toThrow(ConflictException);
    await expect(
      new TeamsService(
        createMockDb([[{ id: 1, name: "Korfball Bantul" }], [{ count: 5 }], [{ count: 0 }], [{ count: 0 }]]) as never,
      ).deleteTeam(1),
    ).rejects.toThrow("Data memiliki histori, nonaktifkan saja.");
  });

  it("throws NotFoundException when getting a non-existent team", async () => {
    const mockDb = createMockDb([[]]);
    const service = new TeamsService(mockDb as never);

    await expect(service.getTeam(999)).rejects.toThrow(NotFoundException);
  });
});
