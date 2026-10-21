import { describe, expect, it } from "vitest";
import { calculateHaversineDistanceMeters, computeAttendanceRate } from "../attendance.calculator.js";

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

describe("calculateHaversineDistanceMeters (BR-34)", () => {
  const WIFA_LAT = -7.900181586573576;
  const WIFA_LNG = 110.32812616243315;

  it("returns 0m when coordinates are identical (at WIFA Sport Center pin)", () => {
    expect(calculateHaversineDistanceMeters(WIFA_LAT, WIFA_LNG, WIFA_LAT, WIFA_LNG)).toBe(0);
  });

  it("calculates ~25m for a point slightly offset inside WIFA Sport Center court", () => {
    const insideLat = -7.900001586573576; // ~20m north
    const insideLng = 110.32822616243315; // ~11m east
    const distance = calculateHaversineDistanceMeters(WIFA_LAT, WIFA_LNG, insideLat, insideLng);
    expect(distance).toBeGreaterThanOrEqual(20);
    expect(distance).toBeLessThanOrEqual(30);
  });

  it("calculates > 100m for a point far outside the 100m geofence radius", () => {
    const outsideLat = -7.895; // ~575m north
    const outsideLng = 110.32812616243315;
    const distance = calculateHaversineDistanceMeters(WIFA_LAT, WIFA_LNG, outsideLat, outsideLng);
    expect(distance).toBeGreaterThan(500);
  });
});
