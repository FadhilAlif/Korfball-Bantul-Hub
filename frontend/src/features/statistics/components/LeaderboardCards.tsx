"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import type { PlayerLeaderboardItem } from "../types";

interface LeaderboardCardsProps {
  players: PlayerLeaderboardItem[];
  offset?: number;
}

export function LeaderboardCards({ players, offset = 0 }: LeaderboardCardsProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground bg-card text-sm">
        Tidak ada data pemain untuk filter ini.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {players.map((p, idx) => {
        const rank = offset + idx + 1;
        return (
          <Link
            key={p.athleteId}
            href={`/stats/players/${p.athleteId}`}
            className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors shadow-xs active:bg-muted/40"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                  rank === 1
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : rank === 2
                      ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      : rank === 3
                        ? "bg-amber-700/20 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {rank}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 h-3.5 ${
                      p.sex === "MALE"
                        ? "border-sky-500/40 text-sky-600 bg-sky-50 dark:bg-sky-950/30"
                        : "border-pink-500/40 text-pink-600 bg-pink-50 dark:bg-pink-950/30"
                    }`}
                  >
                    {p.sexLabel}
                  </Badge>
                  <span className="font-semibold text-sm text-foreground truncate">{p.nickname || p.athleteName}</span>
                  {p.jerseyNumber !== null && (
                    <span className="text-xs font-mono text-muted-foreground">#{p.jerseyNumber}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span>{p.teamName}</span>
                  <span>•</span>
                  <span>{p.gp} Game</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base font-bold text-primary font-mono leading-none">{p.pts}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">PTS</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground mt-0.5 font-mono">
                  <span>
                    EFF <strong className="text-violet-600 dark:text-violet-400">{p.eff}</strong>
                  </span>
                  <span>•</span>
                  <span>%FG {p.pctFgTotalFormatted}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
