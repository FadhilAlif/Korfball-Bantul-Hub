"use client";

import { Crosshair, Info, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { useTeamStats } from "@/features/statistics";
import { DateRangeFilter, type DateRangeValue, getPresetDateRange } from "@/shared/components/common";
import { Button } from "@/shared/components/ui";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";

export interface TeamShootingStats {
  rim: number;
  ria: number;
  pctFgr: number | null;
  sm: number;
  sa: number;
  pctFgs: number | null;
  pm: number;
  pa: number;
  pctP: number | null;
  totalMade: number;
  totalAttempts: number;
  pctFg: number | null;
}

interface ShotDistributionChartProps {
  data?: TeamShootingStats | null;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  runningIn: {
    label: "Running-in (RIM)",
    color: "#8B5CF6", // Violet 500
  },
  distant: {
    label: "Distant Shot (SM)",
    color: "#F59E0B", // Amber 500
  },
  penalty: {
    label: "Penalty (PM)",
    color: "#06B6D4", // Cyan 500
  },
};

export function ShotDistributionChart({ data: initialData, isLoading = false }: ShotDistributionChartProps) {
  const [dateFilter, setDateFilter] = useState<DateRangeValue>(() => ({
    preset: "ALL_TIME",
    ...getPresetDateRange("ALL_TIME"),
  }));

  const isCustomOrPreset = dateFilter.preset !== "ALL_TIME";
  const { data: queriedTeamStats, isLoading: isFilteredLoading } = useTeamStats({
    from: dateFilter.from,
    to: dateFilter.to,
  });

  const activeStats: TeamShootingStats | null | undefined =
    isCustomOrPreset && queriedTeamStats?.shooting
      ? {
          rim: queriedTeamStats.shooting.rim,
          ria: queriedTeamStats.shooting.ria,
          pctFgr: queriedTeamStats.shooting.pctFgr,
          sm: queriedTeamStats.shooting.sm,
          sa: queriedTeamStats.shooting.sa,
          pctFgs: queriedTeamStats.shooting.pctFgs,
          pm: queriedTeamStats.shooting.pm,
          pa: queriedTeamStats.shooting.pa,
          pctP: queriedTeamStats.shooting.pctP,
          totalMade: queriedTeamStats.shooting.rim + queriedTeamStats.shooting.sm + queriedTeamStats.shooting.pm,
          totalAttempts: queriedTeamStats.shooting.ria + queriedTeamStats.shooting.sa + queriedTeamStats.shooting.pa,
          pctFg: queriedTeamStats.shooting.pctFgTotal,
        }
      : (initialData ??
        (queriedTeamStats?.shooting
          ? {
              rim: queriedTeamStats.shooting.rim,
              ria: queriedTeamStats.shooting.ria,
              pctFgr: queriedTeamStats.shooting.pctFgr,
              sm: queriedTeamStats.shooting.sm,
              sa: queriedTeamStats.shooting.sa,
              pctFgs: queriedTeamStats.shooting.pctFgs,
              pm: queriedTeamStats.shooting.pm,
              pa: queriedTeamStats.shooting.pa,
              pctP: queriedTeamStats.shooting.pctP,
              totalMade: queriedTeamStats.shooting.rim + queriedTeamStats.shooting.sm + queriedTeamStats.shooting.pm,
              totalAttempts:
                queriedTeamStats.shooting.ria + queriedTeamStats.shooting.sa + queriedTeamStats.shooting.pa,
              pctFg: queriedTeamStats.shooting.pctFgTotal,
            }
          : null));

  const loading = isLoading || (isCustomOrPreset && isFilteredLoading);

  if (loading && !activeStats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 h-full">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="h-60 w-full bg-muted/40 rounded-xl animate-pulse flex-1" />
      </div>
    );
  }

  const rim = activeStats?.rim ?? 0;
  const sm = activeStats?.sm ?? 0;
  const pm = activeStats?.pm ?? 0;
  const totalMade = activeStats?.totalMade ?? rim + sm + pm;
  const totalAttempts =
    activeStats?.totalAttempts ?? (activeStats?.ria ?? 0) + (activeStats?.sa ?? 0) + (activeStats?.pa ?? 0);
  const pctFg =
    activeStats?.pctFg ?? (totalAttempts > 0 ? Number(((totalMade / totalAttempts) * 100).toFixed(1)) : null);

  const chartData = [
    { name: "runningIn", label: "Running-in (RIM)", value: rim, fill: "#8B5CF6" },
    { name: "distant", label: "Distant Shot (SM)", value: sm, fill: "#F59E0B" },
    { name: "penalty", label: "Penalty (PM)", value: pm, fill: "#06B6D4" },
  ].filter((item) => item.value > 0);

  const hasData = totalMade > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Crosshair size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Distribusi Tembakan</h3>
          </div>
          <p className="text-xs text-muted-foreground pl-9">Proporsi gol RIM, SM, dan PM</p>
        </div>

        {/* Standardized Date Range Filter + Accuracy Badge */}
        <div className="flex items-center gap-2 pl-9 sm:pl-0 flex-wrap sm:flex-nowrap">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20 whitespace-nowrap">
            {pctFg !== null ? `${pctFg}% FG` : "—"}
          </span>

          <DateRangeFilter value={dateFilter} onChange={setDateFilter} defaultPreset="ALL_TIME" />
        </div>
      </div>

      {/* Body: Donut Chart on Left, Detail Stats on Right */}
      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
          <Crosshair size={32} className="mb-2 opacity-40 text-violet-500" />
          <p className="text-xs font-medium">Belum ada statistik tembakan pada rentang tanggal ini</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
            Pencatatan match live recorder akan mengumpulkan data shot selection di sini.
          </p>
          {dateFilter.preset !== "ALL_TIME" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-7 text-xs gap-1.5"
              onClick={() => setDateFilter({ preset: "ALL_TIME" })}
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-center gap-4 py-2 flex-1">
          {/* Donut Chart with Center Text */}
          <div className="relative flex items-center justify-center mx-auto">
            <ChartContainer config={chartConfig} className="h-48 w-48">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={76}
                  paddingAngle={3}
                  strokeWidth={2}
                  stroke="var(--color-background, #fff)"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="font-mono text-xl font-extrabold text-foreground tracking-tight">{totalMade}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Gol
              </span>
            </div>
          </div>

          {/* Breakdown Mini-Cards */}
          <div className="flex flex-col gap-2">
            {/* Running-in */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Running-in (RIM)</div>
                  <div className="text-[10px] text-muted-foreground">Tembakan Terobosan</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-foreground">
                  {rim} <span className="text-[10px] text-muted-foreground font-normal">gol</span>
                </span>
                <div className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                  {activeStats?.pctFgr !== null && activeStats?.pctFgr !== undefined ? `${activeStats.pctFgr}%` : "—"}
                </div>
              </div>
            </div>

            {/* Distant Shot */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Distant Shot (SM)</div>
                  <div className="text-[10px] text-muted-foreground">Tembakan Jarak Jauh</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-foreground">
                  {sm} <span className="text-[10px] text-muted-foreground font-normal">gol</span>
                </span>
                <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {activeStats?.pctFgs !== null && activeStats?.pctFgs !== undefined ? `${activeStats.pctFgs}%` : "—"}
                </div>
              </div>
            </div>

            {/* Penalty */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Penalty (PM)</div>
                  <div className="text-[10px] text-muted-foreground">Lemparan Penalti</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-foreground">
                  {pm} <span className="text-[10px] text-muted-foreground font-normal">gol</span>
                </span>
                <div className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                  {activeStats?.pctP !== null && activeStats?.pctP !== undefined ? `${activeStats.pctP}%` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UX Footer Explanatory Legend */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 text-[11px]">
          <Info size={12} className="shrink-0" />
          <span>RIM: Terobosan | SM: Tembakan Jauh | PM: Penalti</span>
        </div>
        <div className="text-[11px] font-medium">
          Percobaan: <span className="font-mono text-foreground font-bold">{totalAttempts}</span> kali
        </div>
      </div>
    </div>
  );
}
