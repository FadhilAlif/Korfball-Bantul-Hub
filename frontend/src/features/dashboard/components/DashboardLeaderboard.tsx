"use client";

import { ChevronRight, Flame, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePlayerLeaderboard } from "@/features/statistics";
import { DateRangeFilter, type DateRangeValue, getPresetDateRange } from "@/shared/components/common";
import { Avatar, Badge, Button, buttonVariants } from "@/shared/components/ui";

interface DashboardLeaderboardProps {
  isStaff?: boolean;
}

export function DashboardLeaderboard({ isStaff = false }: DashboardLeaderboardProps) {
  const [dateFilter, setDateFilter] = useState<DateRangeValue>(() => ({
    preset: "WEEKLY",
    ...getPresetDateRange("WEEKLY"),
  }));

  const { data, isLoading } = usePlayerLeaderboard({
    from: dateFilter.from,
    to: dateFilter.to,
    limit: 5,
    sort: "pts",
    direction: "desc",
  });
  const players = data?.data ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      {/* Header with Title and Standardized Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Leaderboard Atlet</h3>
          </div>
          <p className="text-xs text-muted-foreground pl-9">Top skor & efisiensi atlet</p>
        </div>

        {/* Standardized Date Range Filter */}
        <div className="pl-9 sm:pl-0 self-start sm:self-auto">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} defaultPreset="WEEKLY" />
        </div>
      </div>

      {/* Leaderboard Ranking Table */}
      {isLoading ? (
        <div className="space-y-2 py-2 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
            <div key={i} className="h-11 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
          <Trophy size={32} className="mb-2 opacity-40 text-amber-500" />
          <p className="text-xs font-medium">Belum ada data pertandingan pada rentang tanggal ini</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
            Poin dan efisiensi pemain akan terakumulasi otomatis saat pertandingan selesai dicatat.
          </p>
          {dateFilter.preset !== "WEEKLY" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-7 text-xs gap-1.5"
              onClick={() =>
                setDateFilter({
                  preset: "WEEKLY",
                  ...getPresetDateRange("WEEKLY"),
                })
              }
            >
              <RotateCcw size={12} />
              <span>Reset ke Mingguan</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 px-2 text-center w-10">Rank</th>
                <th className="py-2 px-3">Nama Atlet</th>
                <th className="py-2 px-2 text-center">GP</th>
                <th className="py-2 px-2 text-right font-bold text-foreground">PTS</th>
                <th className="py-2 px-2 text-right">FG%</th>
                <th className="py-2 px-2 text-right">EFF</th>
                <th className="py-2 px-3 text-center hidden md:table-cell">Rincian Gol (RIM / SM / PM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {players.map((p, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={p.athleteId} className="hover:bg-muted/30 transition-colors">
                    {/* Rank Number Badge (Angka tanpa emoji) */}
                    <td className="py-2 px-2 text-center font-mono">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 text-xs font-extrabold shadow-2xs">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/40 text-slate-800 dark:text-slate-200 border border-slate-400/40 text-xs font-extrabold shadow-2xs">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-500 border border-amber-700/40 text-xs font-extrabold shadow-2xs">
                          3
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs font-semibold">{rank}</span>
                      )}
                    </td>

                    {/* Athlete Name & Jersey */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.athleteName} size={28} />
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{p.athleteName}</span>
                            {p.jerseyNumber !== null && (
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                                #{p.jerseyNumber}
                              </span>
                            )}
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Badge variant={p.sex === "MALE" ? "info" : "primary"} className="text-[9px] px-1 py-0">
                                {p.sex === "MALE" ? "L" : "P"}
                              </Badge>
                            </div>
                          </div>

                        </div>
                      </div>
                    </td>

                    {/* Games Played */}
                    <td className="py-2 px-2 text-center font-mono text-muted-foreground font-medium">{p.gp}</td>

                    {/* Total Points */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {p.pts}
                    </td>

                    {/* FG% */}
                    <td className="py-2 px-2 text-right font-mono text-foreground font-medium">
                      {p.pctFgTotalFormatted}
                    </td>

                    {/* EFF */}
                    <td className="py-2 px-2 text-right font-mono">
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded ${p.eff > 0
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : p.eff < 0
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                          }`}
                      >
                        {p.eff > 0 ? `+${p.eff}` : p.eff}
                      </span>
                    </td>

                    {/* Breakdown */}
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-muted-foreground hidden md:table-cell">
                      <span className="text-violet-600 dark:text-violet-400 font-medium" title="Running-in Made">
                        {p.rim}
                      </span>
                      <span className="text-border mx-1">/</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium" title="Shot Made">
                        {p.sm}
                      </span>
                      <span className="text-border mx-1">/</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium" title="Penalty Made">
                        {p.pm}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer UX Legend & Link */}
      <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            <strong className="text-foreground">PTS</strong>: Poin
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">FG%</strong>: Akurasi
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">EFF</strong>: Efisiensi
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">GP</strong>: Main
          </span>
        </div>

        <Link
          href={isStaff ? "/stats" : "/stats/me"}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1 text-xs -mr-2" })}
        >
          <span>{isStaff ? "Seluruh Statistik Tim" : "Statistik Pribadi Saya"}</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
