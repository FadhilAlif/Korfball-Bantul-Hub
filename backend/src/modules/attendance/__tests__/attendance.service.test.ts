import { BadRequestException, ConflictException, HttpException, HttpStatus } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceService } from "../attendance.service.js";
import { CheckinThrottleService } from "../checkin-throttle.service.js";

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
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
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
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const txMock = {
        select: vi.fn(() => makeChain()),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
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
      return cb(txMock);
    }),
  };
}

describe("AttendanceService & Business Rules (BR-06, BR-07, BR-09, BR-10, BR-11, BR-12, BR-15)", () => {
  let throttle: CheckinThrottleService;

  beforeEach(() => {
    throttle = new CheckinThrottleService();
    vi.useRealTimers();
  });

  it("BR-15: blocks self check-in after 5 failed code attempts (429 Too Many Requests)", async () => {
    const service = new AttendanceService(createMockDb() as never, throttle);
    const userId = 42;

    for (let i = 0; i < 4; i++) {
      throttle.recordFailedAttempt(userId);
    }
    expect(throttle.isBlocked(userId)).toBe(false);

    throttle.recordFailedAttempt(userId);
    expect(throttle.isBlocked(userId)).toBe(true);

    try {
      await service.selfCheckin("WRONG1", userId);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("BR-09: rejects self check-in outside time window [startsAt - 30m, endsAt]", async () => {
    const baseNow = new Date("2026-10-20T17:00:00Z"); // 5 PM
    vi.useFakeTimers();
    vi.setSystemTime(baseNow);

    // Session starts at 6 PM (18:00) and ends at 20:00. Window opens at 17:30.
    const session = {
      id: 1,
      teamId: 1,
      title: "Latihan",
      status: "SCHEDULED",
      startsAt: new Date("2026-10-20T18:00:00Z"),
      endsAt: new Date("2026-10-20T20:00:00Z"),
      lateToleranceMinutes: 15,
      checkinCode: "SEL18A",
    };

    const mockDb = createMockDb([
      // athlete check
      [{ id: 10, teamId: 1, teamIsInternal: true }],
      // session lookup
      [session],
    ]);

    const service = new AttendanceService(mockDb as never, throttle);
    await expect(service.selfCheckin("SEL18A", 10)).rejects.toThrow("Check-in belum dibuka / sudah ditutup.");
  });

  it("BR-10: records PRESENT when checked in within lateToleranceMinutes, LATE when after", async () => {
    vi.useFakeTimers();

    const session = {
      id: 1,
      teamId: 1,
      title: "Latihan",
      status: "SCHEDULED",
      startsAt: new Date("2026-10-20T18:00:00Z"),
      endsAt: new Date("2026-10-20T20:00:00Z"),
      lateToleranceMinutes: 15,
      checkinCode: "SEL18A",
    };

    // 1. On-time check-in at 18:10 (within 15m tolerance)
    vi.setSystemTime(new Date("2026-10-20T18:10:00Z"));
    const mockDb1 = createMockDb([
      [{ id: 10, teamId: 1, teamIsInternal: true }],
      [session],
      [], // no existing record
    ]);
    const service1 = new AttendanceService(mockDb1 as never, throttle);
    const res1 = await service1.selfCheckin("SEL18A", 10);
    expect(res1.status).toBe("PRESENT");

    // 2. Late check-in at 18:20 (exceeds 15m tolerance)
    vi.setSystemTime(new Date("2026-10-20T18:20:00Z"));
    const mockDb2 = createMockDb([
      [{ id: 10, teamId: 1, teamIsInternal: true }],
      [session],
      [], // no existing record
    ]);
    const service2 = new AttendanceService(mockDb2 as never, throttle);
    const res2 = await service2.selfCheckin("SEL18A", 10);
    expect(res2.status).toBe("LATE");
  });

  it("BR-11: rejects self check-in if already recorded as MANUAL or SELF_CHECKIN", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T18:05:00Z"));

    const session = {
      id: 1,
      teamId: 1,
      title: "Latihan",
      status: "SCHEDULED",
      startsAt: new Date("2026-10-20T18:00:00Z"),
      endsAt: new Date("2026-10-20T20:00:00Z"),
      lateToleranceMinutes: 15,
      checkinCode: "SEL18A",
    };

    const mockDb = createMockDb([
      [{ id: 10, teamId: 1, teamIsInternal: true }],
      [session],
      [{ id: 100, method: "MANUAL", status: "PRESENT" }], // already recorded manual
    ]);

    const service = new AttendanceService(mockDb as never, throttle);
    await expect(service.selfCheckin("SEL18A", 10)).rejects.toThrow(ConflictException);
    await expect(
      new AttendanceService(
        createMockDb([
          [{ id: 10, teamId: 1, teamIsInternal: true }],
          [session],
          [{ id: 100, method: "MANUAL", status: "PRESENT" }],
        ]) as never,
        throttle,
      ).selfCheckin("SEL18A", 10),
    ).rejects.toThrow("Kehadiran sudah tercatat.");
  });

  it("BR-12: rejects excuse request submitted after session startsAt (400 BadRequest)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T18:05:00Z")); // 5 minutes after start

    const session = {
      id: 1,
      teamId: 1,
      title: "Latihan",
      status: "SCHEDULED",
      startsAt: new Date("2026-10-20T18:00:00Z"),
      endsAt: new Date("2026-10-20T20:00:00Z"),
    };

    const mockDb = createMockDb([[{ id: 10, teamId: 1 }], [session]]);

    const service = new AttendanceService(mockDb as never, throttle);
    await expect(service.submitExcuse(1, "Sakit flu", 10)).rejects.toThrow(BadRequestException);
    await expect(
      new AttendanceService(createMockDb([[{ id: 10, teamId: 1 }], [session]]) as never, throttle).submitExcuse(
        1,
        "Sakit flu",
        10,
      ),
    ).rejects.toThrow("Izin hanya dapat diajukan sebelum sesi dimulai.");
  });

  it("BR-06: rejects bulk attendance updates on CANCELLED sessions (409 Conflict)", async () => {
    const mockDb = createMockDb([[{ id: 1, status: "CANCELLED" }]]);

    const service = new AttendanceService(mockDb as never, throttle);
    await expect(
      service.bulkUpdateAttendance(1, { records: [{ athleteId: 10, status: "PRESENT" }] }, 1),
    ).rejects.toThrow(ConflictException);
    await expect(
      new AttendanceService(createMockDb([[{ id: 1, status: "CANCELLED" }]]) as never, throttle).bulkUpdateAttendance(
        1,
        { records: [{ athleteId: 10, status: "PRESENT" }] },
        1,
      ),
    ).rejects.toThrow("Sesi dibatalkan.");
  });
});
