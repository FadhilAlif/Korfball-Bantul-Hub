"use client";

import { ArrowRight, CheckCircle2, CloudAlert, CloudOff, Loader2, Pause, Play, Trophy } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { OutboxSyncStatus } from "../../matches/types";

interface ScoreboardProps {
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  totalPeriods: number;
  formattedClock: string;
  isClockRunning: boolean;
  syncStatus: OutboxSyncStatus;
  pendingCount: number;
  wakeLockActive: boolean;
  onToggleClock: () => void;
  onStartPeriod?: () => void;
  onEndPeriod?: () => void;
  onSelectPeriod?: (period: number) => void;
  onFinishMatch?: () => void;
}

export const Scoreboard = memo(function Scoreboard({
  homeTeamName,
  awayTeamName,
  homeColor,
  awayColor,
  homeScore,
  awayScore,
  currentPeriod,
  totalPeriods,
  formattedClock,
  isClockRunning,
  syncStatus,
  pendingCount,
  wakeLockActive,
  onToggleClock,
  onStartPeriod,
  onEndPeriod,
  onSelectPeriod,
  onFinishMatch,
}: ScoreboardProps) {
  const periodNumbers = Array.from({ length: Math.max(1, totalPeriods) }, (_, i) => i + 1);
  const hasNextPeriod = currentPeriod < totalPeriods;

  return (
    <header className="sticky -top-4 md:-top-6 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-xs px-3 sm:px-6 py-2.5 sm:py-3.5 transition-colors">
      <div className="flex flex-col gap-2">
        {/* Top status bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              LIVE RECORD
            </span>
            <span>•</span>
            <span className="font-medium text-foreground">
              Babak {currentPeriod} / {totalPeriods}
            </span>
            {wakeLockActive && (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] py-0 px-1.5 text-emerald-600 border-emerald-500/30"
              >
                Layar Aktif
              </Badge>
            )}
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-2">
            {syncStatus === "synced" && (
              <div className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                <CheckCircle2 size={13} />
                <span className="hidden xs:inline">Tersinkron</span>
              </div>
            )}
            {syncStatus === "syncing" && (
              <div className="flex items-center gap-1 text-amber-600 font-medium text-[11px]">
                <Loader2 size={13} className="animate-spin" />
                <span>Sinkronisasi {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
              </div>
            )}
            {syncStatus === "offline" && (
              <div className="flex items-center gap-1 text-red-600 font-medium text-[11px]">
                <CloudOff size={13} />
                <span>Offline ({pendingCount})</span>
              </div>
            )}
            {syncStatus === "error" && (
              <div className="flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                <CloudAlert size={13} />
                <span>Retry ({pendingCount})</span>
              </div>
            )}
          </div>
        </div>

        {/* Main scoreboard section */}
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
            <div className="truncate">
              <div className="font-bold text-sm sm:text-base md:text-lg text-foreground truncate flex items-center justify-end gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: homeColor || "#FACC15" }}
                />
                <span className="truncate">{homeTeamName}</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">HOME</span>
            </div>
            <div className="w-12 sm:w-16 h-11 sm:h-14 bg-muted/60 rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl text-foreground tabular-nums shadow-inner border border-border">
              {homeScore}
            </div>
          </div>

          {/* Center: Clock & Controls */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
            <div className="font-mono font-bold text-xl sm:text-2xl md:text-3xl tracking-tight text-foreground tabular-nums">
              {formattedClock}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Button
                size="sm"
                variant={isClockRunning ? "outline" : "default"}
                onClick={onToggleClock}
                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1 font-semibold"
              >
                {isClockRunning ? (
                  <>
                    <Pause size={13} />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>Mulai</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Away team */}
          <div className="flex-1 min-w-0 flex items-center justify-start gap-2 text-left">
            <div className="w-12 sm:w-16 h-11 sm:h-14 bg-muted/60 rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl text-foreground tabular-nums shadow-inner border border-border">
              {awayScore}
            </div>
            <div className="truncate">
              <div className="font-bold text-sm sm:text-base md:text-lg text-foreground truncate flex items-center justify-start gap-1.5">
                <span className="truncate">{awayTeamName}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: awayColor || "#3B82F6" }}
                />
              </div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">AWAY</span>
            </div>
          </div>
        </div>

        {/* Period navigation & finish trigger bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Period pills selector */}
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
              {periodNumbers.map((p) => {
                const isActive = p === currentPeriod;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => onSelectPeriod?.(p)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                    title={`Pindah ke Babak ${p}`}
                  >
                    B{p}
                  </button>
                );
              })}
            </div>

            {onStartPeriod && (
              <Button
                size="sm"
                variant="outline"
                onClick={onStartPeriod}
                className="h-6 text-[11px] px-2.5 font-medium text-foreground"
              >
                Mulai Babak {currentPeriod}
              </Button>
            )}
            {onEndPeriod && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onEndPeriod}
                className="h-6 text-[11px] px-2.5 font-semibold gap-1"
              >
                <span>
                  {hasNextPeriod
                    ? `Akhiri Babak ${currentPeriod} & Lanjut B${currentPeriod + 1}`
                    : `Akhiri Babak ${currentPeriod}`}
                </span>
                {hasNextPeriod && <ArrowRight size={11} />}
              </Button>
            )}
          </div>
          {onFinishMatch && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onFinishMatch}
              className="h-6 text-[11px] px-2.5 font-medium gap-1"
            >
              <Trophy size={12} />
              <span>Selesai</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});
