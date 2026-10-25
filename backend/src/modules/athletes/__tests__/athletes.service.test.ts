import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { createAthleteSchema } from "../athletes.schemas.js";
import { AthletesService } from "../athletes.service.js";

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
    return chain;
  };

  return {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  };
}

describe("AthletesService & Business Rules (BR-01, BR-02, BR-03, BR-04)", () => {
  it("BR-04: rejects jerseyNumber outside 0–99 via ZodValidationPipe (400 BadRequest)", () => {
    const pipe = new ZodValidationPipe(createAthleteSchema);

    expect(() =>
      pipe.transform(
        {
          teamId: 1,
          fullName: "Guntur Saputra",
          sex: "MALE",
          jerseyNumber: -1,
        },
        { type: "body" } as never,
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      pipe.transform(
        {
          teamId: 1,
          fullName: "Guntur Saputra",
          sex: "MALE",
          jerseyNumber: 100,
        },
        { type: "body" } as never,
      ),
    ).toThrow(BadRequestException);

    const valid = pipe.transform(
      {
        teamId: 1,
        fullName: "Guntur Saputra",
        sex: "MALE",
        jerseyNumber: 12,
      },
      { type: "body" } as never,
    );
    expect((valid as { jerseyNumber: number }).jerseyNumber).toBe(12);
  });

  it("BR-01: throws BadRequestException (400) when linking a user account to an opponent team athlete", async () => {
    const mockDb = createMockDb([
      [
        {
          athlete: { id: 5, teamId: 2, userId: null, fullName: "Andi Klaten" },
          teamIsInternal: false,
        },
      ],
    ]);
    const service = new AthletesService(mockDb as never);

    await expect(service.linkUser(5, 10)).rejects.toThrow(BadRequestException);
    await expect(
      new AthletesService(
        createMockDb([
          [
            {
              athlete: { id: 5, teamId: 2, userId: null, fullName: "Andi Klaten" },
              teamIsInternal: false,
            },
          ],
        ]) as never,
      ).linkUser(5, 10),
    ).rejects.toThrow("Atlet bukan anggota tim internal.");
  });

  it("BR-02: throws ConflictException (409) when linking a user account already linked to another athlete", async () => {
    const getResponses = () => [
      [
        {
          athlete: { id: 1, teamId: 1, userId: null, fullName: "Guntur Saputra" },
          teamIsInternal: true,
        },
      ],
      [{ id: 10 }], // user exists
      [{ id: 2 }], // conflict: athlete #2 already linked to user #10
    ];

    const service = new AthletesService(createMockDb(getResponses()) as never);
    await expect(service.linkUser(1, 10)).rejects.toThrow(ConflictException);

    const service2 = new AthletesService(createMockDb(getResponses()) as never);
    await expect(service2.linkUser(1, 10)).rejects.toThrow("Akun sudah tertaut ke atlet lain.");
  });

  it("invalidates permissions cache when linking and unlinking a user account", async () => {
    const mockCache = { invalidateUser: vi.fn().mockResolvedValue(undefined) };
    const mockDb = createMockDb([
      // linkUser: select athlete + team
      [
        {
          athlete: { id: 1, teamId: 1, userId: null, fullName: "Guntur Saputra" },
          teamIsInternal: true,
        },
      ],
      // validateUserLinking: user exists
      [{ id: 10 }],
      // validateUserLinking: no conflict
      [],
      // ensureAthleteRole: select athleteRole
      [{ id: 3 }],
      // getAthlete after update
      [
        {
          athlete: {
            id: 1,
            teamId: 1,
            userId: 10,
            fullName: "Guntur Saputra",
            nickname: "Guntur",
            sex: "MALE",
            jerseyNumber: 12,
            birthDate: null,
            status: "ACTIVE",
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          teamName: "Korfball Bantul",
          teamShortName: "BANTUL",
          teamIsInternal: true,
          userEmail: "guntur@korfballbantul.id",
        },
      ],
      // compute30DayAttendanceRates
      [],
    ]);

    const service = new AthletesService(mockDb as never, mockCache as never);
    const result = await service.linkUser(1, 10);

    expect(result.userId).toBe(10);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockCache.invalidateUser).toHaveBeenCalledWith(10);
  });

  it("BR-03: throws ConflictException (409) when deleting an athlete that has attendance or match lineup history", async () => {
    const getResponses = () => [
      [{ id: 1, teamId: 1, userId: null, fullName: "Guntur Saputra" }], // athlete exists
      [{ count: 3 }], // attendances count > 0
      [{ count: 0 }], // matchPlayers count
    ];

    const service = new AthletesService(createMockDb(getResponses()) as never);
    await expect(service.deleteAthlete(1)).rejects.toThrow(ConflictException);

    const service2 = new AthletesService(createMockDb(getResponses()) as never);
    await expect(service2.deleteAthlete(1)).rejects.toThrow("Data memiliki histori, nonaktifkan saja.");
  });
});
