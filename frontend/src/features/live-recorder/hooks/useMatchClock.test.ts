import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatClock, useMatchClock } from "./useMatchClock";

describe("useMatchClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format clock seconds into MM:SS correctly", () => {
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(585)).toBe("09:45");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(-10)).toBe("00:00");
  });

  it("should initialize with provided remaining seconds and paused state", () => {
    const { result } = renderHook(() =>
      useMatchClock({
        initialRemainingSeconds: 600,
        initialIsRunning: false,
      }),
    );

    expect(result.current.remainingSeconds).toBe(600);
    expect(result.current.formattedTime).toBe("10:00");
    expect(result.current.isRunning).toBe(false);
  });

  it("should start and pause clock correctly", () => {
    const onSyncClock = vi.fn();

    const { result } = renderHook(() =>
      useMatchClock({
        initialRemainingSeconds: 600,
        initialIsRunning: false,
        onSyncClock,
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
    expect(onSyncClock).toHaveBeenCalledWith(600, true);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(onSyncClock).toHaveBeenCalledWith(600, false);
  });

  it("should trigger onPeriodZero when countdown reaches zero", () => {
    const onPeriodZero = vi.fn();
    const onSyncClock = vi.fn();

    const { result } = renderHook(() =>
      useMatchClock({
        initialRemainingSeconds: 1,
        initialIsRunning: true,
        onPeriodZero,
        onSyncClock,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onPeriodZero).toHaveBeenCalled();
  });
});
