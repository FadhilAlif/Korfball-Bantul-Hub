"use client";

import { memo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { useRoleDistribution } from "./useRoleDistribution";

const ROLE_COLORS: Record<string, string> = {
  admin: "#EF4444",
  coach: "#3B82F6",
  athlete: "#10B981",
  user: "#F59E0B",
};

const chartConfig: ChartConfig = {
  admin: { label: "Admin", color: "#EF4444" },
  coach: { label: "Coach & Official", color: "#3B82F6" },
  athlete: { label: "Athlete", color: "#10B981" },
  user: { label: "User", color: "#F59E0B" },
};

export const RoleDistribution = memo(function RoleDistribution() {
  const { isLoading, isError, roleBars } = useRoleDistribution();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items are static placeholders with no identity
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-muted rounded animate-pulse w-24" />
            <div className="h-1.5 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load role distribution.</p>;
  }

  const pieData = roleBars.map((r) => ({
    name: r.name,
    label: r.name,
    value: r.count,
    fill: ROLE_COLORS[r.name.toLowerCase()] || "#8B5CF6",
  }));

  const totalUsers = roleBars.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Mini Donut Chart */}
      {totalUsers > 0 && (
        <div className="relative flex items-center justify-center py-1">
          <ChartContainer config={chartConfig} className="h-28 w-28">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={2}
                strokeWidth={1.5}
                stroke="var(--color-background, #fff)"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="font-mono text-sm font-bold text-foreground">{totalUsers}</span>
            <span className="text-[9px] text-muted-foreground uppercase">Users</span>
          </div>
        </div>
      )}

      {/* Role Bars List */}
      <div className="flex flex-col gap-2.5">
        {roleBars.map(({ id, name, count, pct }) => {
          const color = ROLE_COLORS[name.toLowerCase()] || "#8B5CF6";
          return (
            <div key={id}>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                  <span>{name}</span>
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
