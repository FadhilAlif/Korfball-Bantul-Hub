"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseMatchClockOptions {
  initialRemainingSeconds: number;
  initialIsRunning?: boolean;
  initialRunningSince?: string | null;
  onSyncClock?: (remainingSeconds: number, isRunning: boolean) => void;
  onPeriodZero?: () => void;
  syncIntervalMs?: number;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useMatchClock({
  initialRemainingSeconds,
  initialIsRunning = false,
  initialRunningSince = null,
  onSyncClock,
  onPeriodZero,
  syncIntervalMs = 15_000,
}: UseMatchClockOptions) {
  // Compute initial remaining based on server running time if provided
  const calculateInitialRemaining = (): number => {
    if (initialIsRunning && initialRunningSince) {
      const elapsedSec = (Date.now() - new Date(initialRunningSince).getTime()) / 1000;
      return Math.max(0, Math.round(initialRemainingSeconds - elapsedSec));
    }
    return Math.max(0, initialRemainingSeconds);
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateInitialRemaining);
  const [isRunning, setIsRunning] = useState<boolean>(initialIsRunning);

  const startRef = useRef<{ baseRemaining: number; startTime: number } | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRemainingRef = useRef<number>(remainingSeconds);
  const remainingRef = useRef<number>(remainingSeconds);
  const onSyncClockRef = useRef(onSyncClock);
  const onPeriodZeroRef = useRef(onPeriodZero);

  onSyncClockRef.current = onSyncClock;
  onPeriodZeroRef.current = onPeriodZero;
  remainingRef.current = remainingSeconds;

  const start = useCallback(() => {
    if (remainingRef.current <= 0) return;
    setIsRunning(true);
    startRef.current = {
      baseRemaining: remainingRef.current,
      startTime: performance.now(),
    };
    onSyncClockRef.current?.(remainingRef.current, true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    startRef.current = null;
    onSyncClockRef.current?.(remainingRef.current, false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const setTime = useCallback((newSeconds: number) => {
    const val = Math.max(0, Math.round(newSeconds));
    setRemainingSeconds(val);
    remainingRef.current = val;
    if (startRef.current) {
      startRef.current = {
        baseRemaining: val,
        startTime: performance.now(),
      };
    }
  }, []);

  // Update loop via requestAnimationFrame / interval for smooth countdown
  useEffect(() => {
    if (!isRunning) return;

    if (!startRef.current) {
      startRef.current = {
        baseRemaining: remainingRef.current,
        startTime: performance.now(),
      };
    }

    const interval = setInterval(() => {
      if (!startRef.current) return;
      const elapsedSeconds = (performance.now() - startRef.current.startTime) / 1000;
      const nextRemaining = Math.max(0, Math.round(startRef.current.baseRemaining - elapsedSeconds));

      setRemainingSeconds(nextRemaining);
      remainingRef.current = nextRemaining;

      if (nextRemaining <= 0) {
        setIsRunning(false);
        startRef.current = null;
        clearInterval(interval);
        onSyncClockRef.current?.(0, false);
        onPeriodZeroRef.current?.();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Periodic server sync loop
  useEffect(() => {
    if (!isRunning) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      return;
    }

    syncTimerRef.current = setInterval(() => {
      if (remainingRef.current !== lastSyncRemainingRef.current) {
        lastSyncRemainingRef.current = remainingRef.current;
        onSyncClockRef.current?.(remainingRef.current, true);
      }
    }, syncIntervalMs);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [isRunning, syncIntervalMs]);

  return {
    remainingSeconds,
    formattedTime: formatClock(remainingSeconds),
    isRunning,
    start,
    pause,
    toggle,
    setTime,
  };
}
