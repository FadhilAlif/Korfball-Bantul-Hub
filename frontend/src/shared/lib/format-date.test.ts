import { describe, expect, it } from "vitest";
import {
  formatRelative,
  formatWibDate,
  formatWibDateTime,
  formatWibTime,
  fromWibDateTimeInput,
  toWibDateInput,
  toWibDateTimeInput,
} from "./format-date";

describe("format-date utilities (WIB / Asia/Jakarta)", () => {
  // 2026-10-19 02:35:00 UTC === 2026-10-19 09:35:00 WIB
  const utcMorning = "2026-10-19T02:35:00.000Z";
  // 2026-10-18 20:30:00 UTC === 2026-10-19 03:30:00 WIB
  const utcPreviousDayNight = "2026-10-18T20:30:00.000Z";

  it("toWibDateTimeInput converts UTC ISO to local YYYY-MM-DDTHH:mm in WIB", () => {
    expect(toWibDateTimeInput(utcMorning)).toBe("2026-10-19T09:35");
    expect(toWibDateTimeInput(utcPreviousDayNight)).toBe("2026-10-19T03:30");
  });

  it("fromWibDateTimeInput converts YYYY-MM-DDTHH:mm back to UTC ISO correctly", () => {
    const iso = fromWibDateTimeInput("2026-10-19T09:35");
    expect(iso).toBe("2026-10-19T02:35:00.000Z");
  });

  it("toWibDateInput converts to YYYY-MM-DD in WIB", () => {
    expect(toWibDateInput(utcMorning)).toBe("2026-10-19");
    expect(toWibDateInput(utcPreviousDayNight)).toBe("2026-10-19");
  });

  it("formatWibTime formats time in WIB", () => {
    expect(formatWibTime(utcMorning)).toBe("09.35");
    expect(formatWibTime(utcPreviousDayNight)).toBe("03.30");
  });

  it("formatWibDate formats date in Indonesian WIB", () => {
    const formatted = formatWibDate(utcMorning);
    expect(formatted).toContain("19");
    expect(formatted).toContain("2026");
  });

  it("formatWibDateTime formats full datetime with WIB suffix", () => {
    const formatted = formatWibDateTime(utcMorning);
    expect(formatted).toContain("WIB");
    expect(formatted).toContain("09.35");
  });

  it("formatRelative handles recent timestamps", () => {
    expect(formatRelative(new Date().toISOString())).toBe("baru saja");
  });
});
