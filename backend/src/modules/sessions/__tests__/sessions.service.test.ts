import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_ALPHABET, generateCheckinCode, parseWibDateRange, toWibParts } from "../sessions.utils.js";
import { SessionsService } from "../sessions.service.js";

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
    chain.groupBy = vi.fn(() => resolveChain());
    chain.where = vi.fn(() => {
      const p = resolveChain() as Promise<unknown> & Record<string, unknown>;
      p.limit = vi.fn(() => p);
      p.orderBy = vi.fn(() => p);
      p.offset = vi.fn(() => p);
      p.groupBy = vi.fn(() => p);
      return p;
    });
    chain.limit = vi.fn(() => resolveChain());
    return chain;
  };

  return {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 10 }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };
}

describe("SessionsService & Utils", () => {
  it("generateCheckinCode generates 6 characters from CHECKIN_ALPHABET", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCheckinCode();
      expect(code).toHaveLength(6);
      for (const char of code) {
        expect(CHECKIN_ALPHABET.includes(char)).toBe(true);
      }
    }
  });

  it("toWibParts formats UTC date into WIB (UTC+7) correctly", () => {
    // 2026-10-20T11:00:00Z is 2026-10-20 18:00 WIB (Tuesday)
    const d = new Date("2026-10-20T11:00:00Z");
    const parts = toWibParts(d);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(10);
    expect(parts.day).toBe(20);
    expect(parts.hour).toBe(18);
    expect(parts.dayOfWeek).toBe(2); // Tuesday
  });

  it("parseWibDateRange expands date-only strings into full WIB day boundaries", () => {
    const { fromDate, toDate } = parseWibDateRange("2026-10-19", "2026-10-19");
    // 2026-10-19 00:00:00+07:00 === 2026-10-18 17:00:00.000Z
    expect(fromDate?.toISOString()).toBe("2026-10-18T17:00:00.000Z");
    // 2026-10-19 23:59:59.999+07:00 === 2026-10-19 16:59:59.999Z
    expect(toDate?.toISOString()).toBe("2026-10-19T16:59:59.999Z");
  });

  it("BR-05: throws BadRequestException when endsAt is not after startsAt", async () => {
    const mockDb = createMockDb([[{ id: 1 }]]);
    const service = new SessionsService(mockDb as never);

    await expect(
      service.createSession({
        type: "TRAINING",
        title: "Latihan",
        startsAt: "2026-10-20T18:00:00Z",
        endsAt: "2026-10-20T18:00:00Z", // same time
        lateToleranceMinutes: 15,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createSession({
        type: "TRAINING",
        title: "Latihan",
        startsAt: "2026-10-20T19:00:00Z",
        endsAt: "2026-10-20T18:00:00Z", // ends before start
        lateToleranceMinutes: 15,
      }),
    ).rejects.toThrow("Jam selesai harus setelah jam mulai.");
  });

  it("BR-06: cancelSession sets session status to CANCELLED", async () => {
    const mockDb = createMockDb([
      // check existing session
      [{ id: 5, status: "SCHEDULED" }],
      // getSession after cancel
      [
        {
          session: {
            id: 5,
            teamId: 1,
            title: "Latihan",
            type: "TRAINING",
            startsAt: new Date(),
            endsAt: new Date(),
            venue: null,
            lateToleranceMinutes: 15,
            checkinCode: "ABC123",
            status: "CANCELLED",
            notes: null,
            createdBy: null,
            finalizedAt: null,
            finalizedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          teamName: "Korfball Bantul",
          createdByName: "Admin",
        },
      ],
      // getAttendanceSummaries
      [],
    ]);

    const service = new SessionsService(mockDb as never);
    const result = await service.cancelSession(5);
    expect(result.status).toBe("CANCELLED");
  });

  it("deleteSession throws ConflictException if session has attendance records", async () => {
    const mockDb = createMockDb([
      [{ id: 5, status: "SCHEDULED" }],
      [{ count: 2 }], // attendance count > 0
    ]);
    const service = new SessionsService(mockDb as never);

    await expect(service.deleteSession(5)).rejects.toThrow(ConflictException);
    await expect(
      new SessionsService(createMockDb([[{ id: 5 }], [{ count: 2 }]]) as never).deleteSession(5),
    ).rejects.toThrow("Sesi sudah memiliki data presensi dan tidak dapat dihapus.");
  });

  it("masks checkinCode to null when canViewCheckinCode is false (e.g. for athletes)", async () => {
    const mockDb = createMockDb([
      // getSession query
      [
        {
          session: {
            id: 10,
            teamId: 1,
            title: "Latihan Rutin",
            type: "TRAINING",
            startsAt: new Date(),
            endsAt: new Date(),
            venue: "GOR Sasana Krida",
            lateToleranceMinutes: 15,
            checkinCode: "SECRET",
            status: "SCHEDULED",
            notes: null,
            createdBy: 1,
            finalizedAt: null,
            finalizedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          teamName: "Korfball Bantul",
          createdByName: "Coach",
        },
      ],
      // getAttendanceSummaries
      [],
    ]);

    const service = new SessionsService(mockDb as never);
    const sessionForStaff = await service.getSession(10, true);
    expect(sessionForStaff.checkinCode).toBe("SECRET");

    const mockDb2 = createMockDb([
      [
        {
          session: {
            id: 10,
            teamId: 1,
            title: "Latihan Rutin",
            type: "TRAINING",
            startsAt: new Date(),
            endsAt: new Date(),
            venue: "GOR Sasana Krida",
            lateToleranceMinutes: 15,
            checkinCode: "SECRET",
            status: "SCHEDULED",
            notes: null,
            createdBy: 1,
            finalizedAt: null,
            finalizedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          teamName: "Korfball Bantul",
          createdByName: "Coach",
        },
      ],
      [],
    ]);
    const service2 = new SessionsService(mockDb2 as never);
    const sessionForAthlete = await service2.getSession(10, false);
    expect(sessionForAthlete.checkinCode).toBeNull();
  });
});
