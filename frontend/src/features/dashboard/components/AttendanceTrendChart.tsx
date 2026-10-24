"use client";

import { CalendarCheck2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type AttendanceTrendItem, useAttendanceTrend } from "@/features/statistics";
import { DateRangeFilter, type DateRangeValue, getPresetDateRange } from "@/shared/components/common";
import { Button } from "@/shared/components/ui";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";

export type { AttendanceTrendItem };

interface AttendanceTrendChartProps {
  data?: AttendanceTrendItem[];
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  present: {
    label: "Hadir (H)",
    color: "#10B981", // Emerald 500
  },
  late: {
    label: "Terlambat (T)",
    color: "#F59E0B", // Amber 500
  },
  excused: {
    label: "Izin (I)",
    color: "#0284C7", // Sky 600
  },
  absent: {
    label: "Absen (A)",
    color: "#EF4444", // Rose 500
  },
};

export function AttendanceTrendChart({ data: initialData = [], isLoading = false }: AttendanceTrendChartProps) {
  const [dateFilter, setDateFilter] = useState<DateRangeValue>(() => ({
    preset: "ALL_TIME",
    ...getPresetDateRange("ALL_TIME"),
  }));

  const { data: queriedData, isLoading: isFilterLoading } = useAttendanceTrend(
    { from: dateFilter.from, to: dateFilter.to },
    dateFilter.preset === "ALL_TIME" && initialData.length > 0 ? initialData : undefined,
  );

  const data = queriedData ?? (dateFilter.preset === "ALL_TIME" ? initialData : []) ?? [];
  const loading = isLoading || isFilterLoading;

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 h-full">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="h-60 w-full bg-muted/40 rounded-xl animate-pulse flex-1" />
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck2 size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Tren Kehadiran</h3>
          </div>
          <p className="text-xs text-muted-foreground pl-9">Kehadiran tim per sesi latihan</p>
        </div>

        {/* Standardized Date Range Filter + Last Session Rate Badge */}
        <div className="flex items-center gap-2 pl-9 sm:pl-0 flex-wrap sm:flex-nowrap">
          {hasData && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
              {data[data.length - 1].rate}% Hadir
            </span>
          )}
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} defaultPreset="ALL_TIME" />
        </div>
      </div>

      {/* Chart Canvas: maximized to fill available space */}
      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
          <CalendarCheck2 size={32} className="mb-2 opacity-40 text-emerald-500" />
          <p className="text-xs font-medium">Belum ada data sesi latihan pada rentang tanggal ini</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
            Sesi latihan yang sudah dicatat presensinya akan divisualisasikan di sini.
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
        <div className="w-full flex-1 min-h-[220px] sm:min-h-[250px] flex items-center">
          <ChartContainer config={chartConfig} className="h-56 sm:h-64 w-full">
            <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-[11px]" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="excused" stackId="a" fill="var(--color-excused)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* UX Explanatory Legend */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block shrink-0" />
            <span className="font-semibold text-foreground">H</span>
            <span className="text-muted-foreground">(Hadir)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block shrink-0" />
            <span className="font-semibold text-foreground">T</span>
            <span className="text-muted-foreground">(Terlambat)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7] inline-block shrink-0" />
            <span className="font-semibold text-foreground">I</span>
            <span className="text-muted-foreground">(Izin)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block shrink-0" />
            <span className="font-semibold text-foreground">A</span>
            <span className="text-muted-foreground">(Absen)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
