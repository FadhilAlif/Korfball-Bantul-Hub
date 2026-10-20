import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateRangeFilter, type DateRangeValue, formatDateRangeLabel, getPresetDateRange } from "./DateRangeFilter";

afterEach(() => {
  cleanup();
});

describe("formatDateRangeLabel", () => {
  it("formats preset labels correctly", () => {
    expect(formatDateRangeLabel({ preset: "WEEKLY" })).toBe("Mingguan");
    expect(formatDateRangeLabel({ preset: "MONTHLY" })).toBe("Bulanan");
    expect(formatDateRangeLabel({ preset: "ALL_TIME" })).toBe("Semua Waktu");
  });

  it("formats custom date range correctly", () => {
    const label = formatDateRangeLabel({
      preset: "CUSTOM",
      from: "2026-10-01",
      to: "2026-10-20",
    });
    expect(label).toContain("Okt");
  });
});

describe("getPresetDateRange", () => {
  it("calculates weekly range (7 days)", () => {
    const range = getPresetDateRange("WEEKLY");
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();
    expect(range.from).not.toBe(range.to);
  });

  it("returns undefined dates for ALL_TIME", () => {
    const range = getPresetDateRange("ALL_TIME");
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });
});

describe("DateRangeFilter Component", () => {
  it("renders trigger button with active preset label", () => {
    const value: DateRangeValue = { preset: "WEEKLY", ...getPresetDateRange("WEEKLY") };
    const onChange = vi.fn();

    render(<DateRangeFilter value={value} onChange={onChange} defaultPreset="WEEKLY" />);

    expect(screen.getByText("Mingguan")).toBeDefined();
  });

  it("opens popover and allows selecting a different preset", () => {
    const value: DateRangeValue = { preset: "ALL_TIME" };
    const onChange = vi.fn();

    render(<DateRangeFilter value={value} onChange={onChange} defaultPreset="ALL_TIME" />);

    const trigger = screen.getByText("Semua Waktu");
    fireEvent.click(trigger);

    // Popover opens
    expect(screen.getByText("Rentang Waktu")).toBeDefined();
    expect(screen.getByText("Bulanan")).toBeDefined();

    fireEvent.click(screen.getByText("Bulanan"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: "MONTHLY",
      }),
    );
  });
});
