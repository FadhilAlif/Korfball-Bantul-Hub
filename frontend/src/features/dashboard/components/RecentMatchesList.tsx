"use client";

import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

interface RecentMatchesListProps {
  matches: {
    id: number;
    scheduledAt: string;
    matchType: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
  }[];
}

export function RecentMatchesList({ matches }: RecentMatchesListProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <h3 className="font-semibold text-[15px] text-foreground">Hasil Pertandingan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pertandingan terakhir yang telah selesai</p>
        </div>
        <Link
          href="/matches"
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {matches.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Belum ada pertandingan selesai.</div>
        ) : (
          matches.map((m) => {
            const dateStr = new Date(m.scheduledAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            });

            return (
              <Link
                key={m.id}
                href={`/matches/${m.id}/box-score`}
                className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {m.homeTeamName} vs {m.awayTeamName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-sans">{m.matchType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-muted rounded font-mono font-bold text-xs text-foreground">
                    {m.homeScore} : {m.awayScore}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
