"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import type { PlayerLeaderboardItem } from "../types";

interface LeaderboardTableProps {
  players: PlayerLeaderboardItem[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  offset?: number;
}

export function LeaderboardTable({ players, sortField, sortDirection, onSort, offset = 0 }: LeaderboardTableProps) {
  const renderSortHeader = (field: string, label: string, title?: string) => {
    const isSorted = sortField === field;
    return (
      <th
        scope="col"
        className="px-2.5 py-3 font-semibold text-center cursor-pointer select-none hover:bg-muted/70 transition-colors whitespace-nowrap text-xs text-muted-foreground"
        title={title ?? label}
        onClick={() => onSort(field)}
      >
        <div className="inline-flex items-center gap-1">
          <span>{label}</span>
          {isSorted ? (
            sortDirection === "asc" ? (
              <ArrowUp size={12} className="text-primary shrink-0" />
            ) : (
              <ArrowDown size={12} className="text-primary shrink-0" />
            )
          ) : (
            <ArrowUpDown size={11} className="text-muted-foreground/40 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto border border-border rounded-xl bg-card shadow-xs">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted/40 border-b border-border sticky top-0 z-10">
          <tr>
            <th scope="col" className="w-10 px-3 py-3 font-semibold text-center text-xs text-muted-foreground">
              #
            </th>
            <th
              scope="col"
              className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-muted/70 transition-colors text-xs text-muted-foreground min-w-[180px] sticky left-0 bg-muted/40 z-20"
              onClick={() => onSort("athleteName")}
            >
              <div className="inline-flex items-center gap-1">
                <span>Pemain</span>
                {sortField === "athleteName" &&
                  (sortDirection === "asc" ? (
                    <ArrowUp size={12} className="text-primary" />
                  ) : (
                    <ArrowDown size={12} className="text-primary" />
                  ))}
              </div>
            </th>
            <th scope="col" className="px-2.5 py-3 font-semibold text-center text-xs text-muted-foreground">
              Tim
            </th>
            {renderSortHeader("gp", "GP", "Games Played (Match Selesai Dimainkan)")}
            {renderSortHeader("pts", "PTS", "Total Points (SM + RIM + PM)")}
            {renderSortHeader("ppg", "PPG", "Points Per Game")}
            {renderSortHeader("pctFgTotal", "%FG", "Total Field Goal Percentage")}
            {renderSortHeader("sm", "SM/SA", "Shot Made / Shot Attempt")}
            {renderSortHeader("pctFgs", "%FGS", "Shot Accuracy")}
            {renderSortHeader("rim", "RIM/RIA", "Running In Made / Attempt")}
            {renderSortHeader("pctFgr", "%FGR", "Running In Accuracy")}
            {renderSortHeader("pm", "PM/PA", "Penalty Made / Attempt")}
            {renderSortHeader("pctP", "%P", "Penalty Accuracy")}
            {renderSortHeader("tot", "TOT", "Total Rebound (DR + OR)")}
            {renderSortHeader("rpg", "RPG", "Rebounds Per Game")}
            {renderSortHeader("d", "D", "Defended / Dek")}
            {renderSortHeader("as", "AS", "Assists")}
            {renderSortHeader("apg", "APG", "Assists Per Game")}
            {renderSortHeader("it", "IT", "Intercepts")}
            {renderSortHeader("tov", "TOV", "Turnovers")}
            {renderSortHeader("f", "F", "Fouls")}
            {renderSortHeader("yc", "YC", "Yellow Cards")}
            {renderSortHeader("rc", "RC", "Red Cards")}
            {renderSortHeader("eff", "EFF", "Total Player Efficiency Rating")}
            {renderSortHeader("epg", "EPG", "Efficiency Per Game")}
            <th scope="col" className="w-10 px-2 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {players.length === 0 ? (
            <tr>
              <td colSpan={26} className="text-center py-10 text-muted-foreground">
                Tidak ada data pemain untuk filter ini.
              </td>
            </tr>
          ) : (
            players.map((p, idx) => {
              const rank = offset + idx + 1;
              return (
                <tr key={p.athleteId} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                  <td className="px-3 py-2.5 text-center font-medium">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold ${
                        rank === 1
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : rank === 2
                            ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            : rank === 3
                              ? "bg-amber-700/20 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                              : "text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 sticky left-0 bg-card group-hover:bg-muted/30 z-10 transition-colors">
                    <Link href={`/stats/players/${p.athleteId}`} className="flex items-center gap-2 hover:underline">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          p.sex === "MALE"
                            ? "border-sky-500/40 text-sky-600 bg-sky-50 dark:bg-sky-950/30"
                            : "border-pink-500/40 text-pink-600 bg-pink-50 dark:bg-pink-950/30"
                        }`}
                      >
                        {p.sexLabel}
                      </Badge>
                      <span className="font-semibold text-foreground">{p.nickname || p.athleteName}</span>
                      {p.jerseyNumber !== null && (
                        <span className="text-[11px] font-mono text-muted-foreground">#{p.jerseyNumber}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-2.5 py-2.5 text-center whitespace-nowrap text-muted-foreground text-[11px]">
                    {p.teamName}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-medium">{p.gp}</td>
                  <td className="px-2.5 py-2.5 text-center font-bold text-primary">{p.pts}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono font-medium">{p.ppg.toFixed(1)}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono">
                    <span
                      className={
                        p.pctFgTotal !== null && p.pctFgTotal >= 40
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : ""
                      }
                    >
                      {p.pctFgTotalFormatted}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {p.sm}/{p.sa}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono">{p.pctFgsFormatted}</td>
                  <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {p.rim}/{p.ria}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono">{p.pctFgrFormatted}</td>
                  <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {p.pm}/{p.pa}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono">{p.pctPFormatted}</td>
                  <td className="px-2.5 py-2.5 text-center font-semibold text-foreground font-mono">{p.tot}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">{p.rpg.toFixed(1)}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono">{p.d}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {p.as}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">{p.apg.toFixed(1)}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono">{p.it}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono text-amber-600">{p.tov}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">{p.f}</td>
                  <td className="px-2.5 py-2.5 text-center font-mono">
                    {p.yc > 0 ? (
                      <span className="px-1 bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded font-semibold">
                        {p.yc}
                      </span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono">
                    {p.rc > 0 ? (
                      <span className="px-1 bg-red-500/20 text-red-600 rounded font-semibold">{p.rc}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono font-bold text-violet-600 dark:text-violet-400">
                    {p.eff}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono font-semibold text-violet-600/80 dark:text-violet-400/80">
                    {p.epg.toFixed(1)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Link
                      href={`/stats/players/${p.athleteId}`}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-1 rounded-md"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
