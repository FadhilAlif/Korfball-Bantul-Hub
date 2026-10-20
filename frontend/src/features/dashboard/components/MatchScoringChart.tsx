"use client";

import { Info, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";

export interface MatchScoringItem {
  id: number;
  scheduledAt: string;
  matchType: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  teamScore?: number;
  opponentScore?: number;
  opponentName?: string;
  result?: "W" | "L" | "D";
}

interface MatchScoringChartProps {
  matches?: MatchScoringItem[];
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  teamScore: {
    label: "Korfball Bantul",
    color: "#3B82F6", // Blue 500
  },
  opponentScore: {
    label: "Tim Lawan",
    color: "#94A3B8", // Slate 400
  },
};


export function MatchScoringChart({ matches = [], isLoading = false }: MatchScoringChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 h-full">
        <div className="h-5 w-44 bg-muted rounded animate-pulse" />
        <div className="h-64 w-full bg-muted/40 rounded-xl animate-pulse flex-1" />
      </div>
    );
  }

  // Reverse so earliest to latest for left-to-right progression
  const chartData = [...matches].reverse().map((m) => {
    const opp = m.opponentName || m.awayTeamName || "Lawan";
    const shortOpp = opp.length > 10 ? `${opp.slice(0, 8)}…` : opp;
    const dateStr = new Date(m.scheduledAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    return {
      matchId: m.id,
      label: `${shortOpp} (${dateStr})`,
      fullOpponent: opp,
      date: dateStr,
      teamScore: m.teamScore ?? m.homeScore,
      opponentScore: m.opponentScore ?? m.awayScore,
      result: m.result ?? (m.homeScore > m.awayScore ? "W" : m.homeScore < m.awayScore ? "L" : "D"),
    };
  });

  const hasData = chartData.length > 0;

  // Aggregate stats from the matches
  const totalMatches = chartData.length;
  const totalTeamScore = chartData.reduce((acc, m) => acc + (m.teamScore ?? 0), 0);
  const totalOppScore = chartData.reduce((acc, m) => acc + (m.opponentScore ?? 0), 0);
  const avgTeamScore = totalMatches > 0 ? (totalTeamScore / totalMatches).toFixed(1) : "0";
  const avgOppScore = totalMatches > 0 ? (totalOppScore / totalMatches).toFixed(1) : "0";
  const scoreDiff = totalTeamScore - totalOppScore;
  const wins = chartData.filter((m) => m.result === "W").length;
  const losses = chartData.filter((m) => m.result === "L").length;
  const draws = chartData.filter((m) => m.result === "D").length;


  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Trophy size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Tren Skor Pertandingan</h3>
          </div>
          <p className="text-xs text-muted-foreground pl-9">Skor Korfball Bantul vs lawan</p>
        </div>

        {hasData && (
          <div className="flex items-center gap-1.5 pl-9 sm:pl-0 text-xs">
            {chartData.map((m) => (
              <span
                key={m.matchId}
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${m.result === "W"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : m.result === "L"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
              >
                {m.result}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Score Metrics Strip to fill space with valuable insight */}
      {hasData && (
        <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl border border-border bg-muted/20 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground font-medium">Rerata Skor</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
              {avgTeamScore} <span className="text-[10px] font-normal text-muted-foreground">PPG</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-medium">Kebobolan</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-slate-600 dark:text-slate-400">
              {avgOppScore} <span className="text-[10px] font-normal text-muted-foreground">PAG</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-medium">Selisih</div>
            <div
              className={`text-xs sm:text-sm font-bold font-mono ${scoreDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
            >
              {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-medium">Rekor Laga</div>
            <div className="text-xs sm:text-sm font-bold font-mono">
              <span className="text-emerald-500">{wins}W</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-rose-500">{losses}L</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-amber-500">{draws}D</span>
            </div>
          </div>

        </div>
      )}

      {/* Chart Canvas: maximized to fill full card height */}
      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
          <Trophy size={32} className="mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-medium">Belum ada pertandingan selesai</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
            Hasil skor pertandingan yang telah selesai akan muncul di grafik ini.
          </p>
        </div>
      ) : (
        <div className="w-full flex-1 min-h-[220px] sm:min-h-[250px] flex items-center">
          <ChartContainer config={chartConfig} className="h-56 sm:h-64 w-full">
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} className="text-[11px]" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="teamScore" fill="var(--color-teamScore)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opponentScore" fill="var(--color-opponentScore)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* UX Explanatory Legend */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] inline-block shrink-0" />
            <span className="font-semibold text-foreground">Korfball Bantul</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#94A3B8] inline-block shrink-0" />
            <span className="font-semibold text-foreground">Tim Lawan</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info size={12} className="shrink-0" />
          <span>
            <strong className="text-emerald-600 font-semibold">W</strong> Menang ·{" "}
            <strong className="text-rose-600 font-semibold">L</strong> Kalah ·{" "}
            <strong className="text-amber-600 font-semibold">D</strong> Seri
          </span>
        </div>
      </div>
    </div>
  );
}
