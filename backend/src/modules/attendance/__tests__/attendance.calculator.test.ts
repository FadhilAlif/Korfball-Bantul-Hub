import { describe, expect, it } from "vitest";
import { computeAttendanceRate } from "../attendance.calculator.js";

describe("computeAttendanceRate (BR-13)", () => {
  it("returns null when denominator is 0 (no completed sessions / no records)", () => {
    expect(computeAttendanceRate({ present: 0, late: 0, excused: 0, absent: 0 })).toBeNull();
  });

  it("calculates 100% when all sessions are attended on time", () => {
    expect(computeAttendanceRate({ present: 10, late: 0, excused: 0, absent: 0 })).toBe(100);
  });

  it("considers LATE as attended", () => {
    // 5 PRESENT + 5 LATE = 10 attended out of 10 = 100%
    expect(computeAttendanceRate({ present: 5, late: 5, excused: 0, absent: 0 })).toBe(100);
  });

  it("includes EXCUSED in denominator (represents planned commitment)", () => {
    // 4 attended (3 present + 1 late) out of 5 total (1 excused) = 80.0%
    expect(computeAttendanceRate({ present: 3, late: 1, excused: 1, absent: 0 })).toBe(80);
  });

  it("rounds to 1 decimal place properly", () => {
    // 1 attended out of 3 = 33.333...% -> 33.3%
    expect(computeAttendanceRate({ present: 1, late: 0, excused: 0, absent: 2 })).toBe(33.3);
    // 2 attended out of 3 = 66.666...% -> 66.7%
    expect(computeAttendanceRate({ present: 2, late: 0, excused: 1, absent: 0 })).toBe(66.7);
  });
});
