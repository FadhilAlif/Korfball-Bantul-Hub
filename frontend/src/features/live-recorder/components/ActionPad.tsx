"use client";

import { AlertTriangle, Clock, Flame, RotateCcw, Shield } from "lucide-react";
import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { MatchEventType } from "../../matches/types";

interface ActionPadProps {
  hasSelectedPlayer: boolean;
  selectedAction: MatchEventType | null;
  onActionClick: (type: MatchEventType) => void;
  onTeamTurnover: () => void;
  onTeamTimeout: () => void;
  className?: string;
}

export const ActionPad = memo(function ActionPad({
  hasSelectedPlayer,
  selectedAction,
  onActionClick,
  onTeamTurnover,
  onTeamTimeout,
  className,
}: ActionPadProps) {
  return (
    <div className={cn("flex flex-col gap-2.5 p-3 rounded-2xl bg-card border border-border shadow-xs", className)}>
      {/* Indicator message */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tracking-wide uppercase text-[11px]">Action Pad</span>
        <span>
          {hasSelectedPlayer ? (
            <span className="text-primary font-medium">Pemain Terpilih → Klik Aksi</span>
          ) : selectedAction ? (
            <span className="text-amber-500 font-medium">Aksi Aktif ({selectedAction}) → Klik Pemain</span>
          ) : (
            <span>Pilih Pemain atau Aksi</span>
          )}
        </span>
      </div>

      {/* Category 1: Scoring / Tembakan */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Flame size={11} className="text-amber-500" />
          Poin & Tembakan
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {/* Shot Made */}
          <button
            type="button"
            onClick={() => onActionClick("SHOT_MADE")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all select-none min-h-[48px]",
              selectedAction === "SHOT_MADE"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95",
            )}
          >
            <span className="font-black text-sm tracking-tight leading-none">SM (+1)</span>
            <span className="text-[10px] font-medium opacity-90 mt-0.5">Shot Masuk</span>
          </button>

          {/* Running In Made */}
          <button
            type="button"
            onClick={() => onActionClick("RUNNING_IN_MADE")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all select-none min-h-[48px]",
              selectedAction === "RUNNING_IN_MADE"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95",
            )}
          >
            <span className="font-black text-sm tracking-tight leading-none">RIM (+1)</span>
            <span className="text-[10px] font-medium opacity-90 mt-0.5">Running In</span>
          </button>

          {/* Penalty Made */}
          <button
            type="button"
            onClick={() => onActionClick("PENALTY_MADE")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all select-none min-h-[48px]",
              selectedAction === "PENALTY_MADE"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95",
            )}
          >
            <span className="font-black text-sm tracking-tight leading-none">PM (+1)</span>
            <span className="text-[10px] font-medium opacity-90 mt-0.5">Penalti Masuk</span>
          </button>

          {/* Shot Attempt (Missed) */}
          <button
            type="button"
            onClick={() => onActionClick("SHOT_MISSED")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "SHOT_MISSED"
                ? "bg-muted text-foreground border-foreground/30 shadow-xs ring-2 ring-foreground/20"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 active:scale-95",
            )}
          >
            <span className="font-bold text-xs tracking-tight">SA</span>
            <span className="text-[9px] opacity-80">Shot Gagal</span>
          </button>

          {/* Running In Attempt (Missed) */}
          <button
            type="button"
            onClick={() => onActionClick("RUNNING_IN_MISSED")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "RUNNING_IN_MISSED"
                ? "bg-muted text-foreground border-foreground/30 shadow-xs ring-2 ring-foreground/20"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 active:scale-95",
            )}
          >
            <span className="font-bold text-xs tracking-tight">RIA</span>
            <span className="text-[9px] opacity-80">Run-in Gagal</span>
          </button>

          {/* Penalty Attempt (Missed) */}
          <button
            type="button"
            onClick={() => onActionClick("PENALTY_MISSED")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "PENALTY_MISSED"
                ? "bg-muted text-foreground border-foreground/30 shadow-xs ring-2 ring-foreground/20"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 active:scale-95",
            )}
          >
            <span className="font-bold text-xs tracking-tight">PA</span>
            <span className="text-[9px] opacity-80">Penalti Gagal</span>
          </button>
        </div>
      </div>

      {/* Category 2: Rebounds & Defense */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Shield size={11} className="text-sky-500" />
          Rebound & Defense
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {/* DR */}
          <button
            type="button"
            onClick={() => onActionClick("REBOUND_DEF")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "REBOUND_DEF"
                ? "bg-sky-600 text-white border-sky-700 shadow-sm ring-2 ring-sky-500/50"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">DR</span>
            <span className="text-[9px]">Reb Def</span>
          </button>

          {/* OR */}
          <button
            type="button"
            onClick={() => onActionClick("REBOUND_OFF")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "REBOUND_OFF"
                ? "bg-sky-600 text-white border-sky-700 shadow-sm ring-2 ring-sky-500/50"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">OR</span>
            <span className="text-[9px]">Reb Off</span>
          </button>

          {/* Deck */}
          <button
            type="button"
            onClick={() => onActionClick("DECK")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "DECK"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/50"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">D</span>
            <span className="text-[9px]">Deck/Block</span>
          </button>

          {/* Intercept */}
          <button
            type="button"
            onClick={() => onActionClick("INTERCEPT")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "INTERCEPT"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/50"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">IT</span>
            <span className="text-[9px]">Intercept</span>
          </button>
        </div>
      </div>

      {/* Category 3: Playmaking, Turnovers, Discipline */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle size={11} className="text-amber-500" />
          Playmaking, Error & Disiplin
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {/* Assist */}
          <button
            type="button"
            onClick={() => onActionClick("ASSIST")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "ASSIST"
                ? "bg-violet-600 text-white border-violet-700 shadow-sm ring-2 ring-violet-500/50"
                : "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 hover:bg-violet-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">AS</span>
            <span className="text-[9px]">Assist</span>
          </button>

          {/* Personal Turnover */}
          <button
            type="button"
            onClick={() => onActionClick("TURNOVER")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "TURNOVER" || selectedAction === "TURNOVER_PERSONAL"
                ? "bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/50"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">TOV</span>
            <span className="text-[9px]">Turnover</span>
          </button>

          {/* Foul */}
          <button
            type="button"
            onClick={() => onActionClick("FOUL")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all select-none min-h-[46px]",
              selectedAction === "FOUL"
                ? "bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-500/50"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 active:scale-95",
            )}
          >
            <span className="font-bold text-xs">F</span>
            <span className="text-[9px]">Foul</span>
          </button>

          {/* Cards (YC/RC) */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onActionClick("YELLOW_CARD")}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg border text-center transition-all select-none min-h-[46px]",
                selectedAction === "YELLOW_CARD"
                  ? "bg-yellow-500 text-slate-900 border-yellow-600 shadow-sm"
                  : "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 hover:bg-yellow-400/30 active:scale-95",
              )}
            >
              <span className="font-bold text-xs">YC</span>
              <span className="text-[8px]">Kuning</span>
            </button>
            <button
              type="button"
              onClick={() => onActionClick("RED_CARD")}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg border text-center transition-all select-none min-h-[46px]",
                selectedAction === "RED_CARD"
                  ? "bg-red-600 text-white border-red-700 shadow-sm"
                  : "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40 hover:bg-red-500/30 active:scale-95",
              )}
            >
              <span className="font-bold text-xs">RC</span>
              <span className="text-[8px]">Merah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category 4: Team Operations */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={onTeamTurnover}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 text-xs font-semibold transition-all select-none min-h-[44px]"
        >
          <RotateCcw size={13} />
          <span>Team Turnover (TOVT)</span>
        </button>

        <button
          type="button"
          onClick={onTeamTimeout}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 text-xs font-semibold transition-all select-none min-h-[44px]"
        >
          <Clock size={13} />
          <span>Time-out Tim</span>
        </button>
      </div>
    </div>
  );
});
