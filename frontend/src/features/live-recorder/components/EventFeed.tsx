"use client";

import { History, RotateCcw, Trash2 } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { BatchEventItem, MatchPlayerItem } from "../../matches/types";
import { formatClock } from "../hooks/useMatchClock";

interface EventFeedProps {
  events: BatchEventItem[];
  players: MatchPlayerItem[];
  homeTeamName: string;
  awayTeamName: string;
  onUndoLast: () => void;
  onDeleteEvent?: (eventId: string) => void;
  className?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  SHOT_MADE: {
    label: "Shot Masuk (SM)",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  SHOT_MISSED: { label: "Shot Gagal (SA)", color: "bg-muted text-muted-foreground border-border" },
  RUNNING_IN_MADE: {
    label: "Running In (RIM)",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  RUNNING_IN_MISSED: { label: "Running In Gagal (RIA)", color: "bg-muted text-muted-foreground border-border" },
  PENALTY_MADE: {
    label: "Penalti Masuk (PM)",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  PENALTY_MISSED: { label: "Penalti Gagal (PA)", color: "bg-muted text-muted-foreground border-border" },
  REBOUND_DEF: { label: "Def Rebound (DR)", color: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  REBOUND_OFF: { label: "Off Rebound (OR)", color: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  DECK: {
    label: "Deck / Block (D)",
    color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  ASSIST: { label: "Assist (AS)", color: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30" },
  INTERCEPT: {
    label: "Intercept (IT)",
    color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  TURNOVER: {
    label: "Turnover (TOV)",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  TEAM_TURNOVER: {
    label: "Team Turnover (TOVT)",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  TURNOVER_PERSONAL: {
    label: "Turnover (TOV)",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  TURNOVER_TEAM: {
    label: "Team Turnover (TOVT)",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  FOUL: { label: "Foul (F)", color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  YELLOW_CARD: {
    label: "Kartu Kuning (YC)",
    color: "bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/40",
  },
  RED_CARD: { label: "Kartu Merah (RC)", color: "bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40" },
  SUBSTITUTION: { label: "Substitusi", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  TIMEOUT: { label: "Time-out", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
};

export const EventFeed = memo(function EventFeed({
  events,
  players,
  homeTeamName,
  awayTeamName,
  onUndoLast,
  onDeleteEvent,
  className,
}: EventFeedProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-2xl bg-card border border-border ${className || ""}`}>
      {/* Header with Undo button */}
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground uppercase tracking-wider">
          <History size={13} className="text-muted-foreground" />
          <span>Histori Event ({events.length})</span>
        </div>

        {events.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUndoLast}
            className="h-6 text-[11px] px-2 gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <RotateCcw size={11} />
            <span>Undo Terakhir</span>
          </Button>
        )}
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">Belum ada event tercatat dalam sesi ini.</div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {events.slice(0, 100).map((e) => {
            const player = e.matchPlayerId ? playerMap.get(e.matchPlayerId) : null;
            const subInPlayer = e.subInPlayerId ? playerMap.get(e.subInPlayerId) : null;
            const actionDef = ACTION_LABELS[e.type] || {
              label: e.type,
              color: "bg-muted text-muted-foreground border-border",
            };

            const teamLabel = e.side === "HOME" ? homeTeamName : awayTeamName;

            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Period & clock */}
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0">
                    B{e.period} {formatClock(e.clockSeconds)}
                  </span>

                  {/* Team badge */}
                  <span className="text-[10px] font-semibold text-foreground/80 shrink-0">
                    {e.side === "HOME" ? "H" : "A"}
                  </span>

                  {/* Action badge */}
                  <Badge variant="outline" className={`text-[10px] py-0 px-1.5 shrink-0 ${actionDef.color}`}>
                    {actionDef.label}
                  </Badge>

                  {/* Player info */}
                  <div className="truncate text-muted-foreground text-[11px]">
                    {player ? (
                      <span>
                        #{player.jerseyNumber} {player.athleteNickname || player.athleteName}
                        {subInPlayer && (
                          <span className="text-foreground">
                            {" "}
                            → #{subInPlayer.jerseyNumber} {subInPlayer.athleteNickname || subInPlayer.athleteName}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>{teamLabel}</span>
                    )}
                  </div>
                </div>

                {onDeleteEvent && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteEvent(e.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    title="Hapus event"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
