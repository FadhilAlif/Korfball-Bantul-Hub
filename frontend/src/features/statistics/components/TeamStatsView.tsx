"use client";

import { Award, Flame, ShieldAlert, Target, Trophy, UsersRound } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { TeamStatsSummary } from "../types";

interface TeamStatsViewProps {
  stats: TeamStatsSummary;
  isLoading?: boolean;
}

export function TeamStatsView({ stats, isLoading }: TeamStatsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">Memuat statistik tim...</div>
    );
  }

  const { team, overall, shooting, totals, scrimmageInternal } = stats;

  return (
    <div className="flex flex-col gap-5">
      {/* Team Record Hero Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{team.name}</h2>
            {team.isInternal && (
              <Badge variant="default" className="text-xs">
                Tim Internal
              </Badge>
            )}
            {team.region && <span className="text-xs text-muted-foreground">({team.region})</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rekap agregat seluruh pertandingan resmi & uji coba yang telah selesai (Finished)
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-muted/40 px-3.5 py-2 rounded-lg border border-border">
            <Trophy size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-medium">Rekor W-L-D</div>
              <div className="text-base font-bold font-mono">
                <span className="text-emerald-600">{overall.wins}M</span> -{" "}
                <span className="text-rose-600">{overall.losses}K</span> -{" "}
                <span className="text-muted-foreground">{overall.draws}S</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 px-3.5 py-2 rounded-lg border border-border">
            <Flame size={18} className="text-orange-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
              <div className="text-base font-bold font-mono text-foreground">{overall.winRate.toFixed(1)}%</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 px-3.5 py-2 rounded-lg border border-border">
            <Target size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-medium">Gol / Selisih</div>
              <div className="text-base font-bold font-mono">
                {overall.goalsFor}:{overall.goalsAgainst}{" "}
                <span
                  className={`text-xs ${
                    overall.goalDifference > 0
                      ? "text-emerald-600 font-semibold"
                      : overall.goalDifference < 0
                        ? "text-rose-600 font-semibold"
                        : "text-muted-foreground"
                  }`}
                >
                  ({overall.goalDifference >= 0 ? `+${overall.goalDifference}` : overall.goalDifference})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Shooting vs Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shooting Performance */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Target size={16} className="text-primary" />
              <span>Akurasi Tembakan Tim (%FG)</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              {shooting.pctFgTotal !== null ? `${shooting.pctFgTotal.toFixed(1)}%` : "-"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Shoot (S)</span>
              <span className="text-base font-bold font-mono">
                {shooting.pctFgs !== null ? `${shooting.pctFgs.toFixed(1)}%` : "-"}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {shooting.sm} / {shooting.sa}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Running In (RI)</span>
              <span className="text-base font-bold font-mono">
                {shooting.pctFgr !== null ? `${shooting.pctFgr.toFixed(1)}%` : "-"}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {shooting.rim} / {shooting.ria}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Penalty (P)</span>
              <span className="text-base font-bold font-mono">
                {shooting.pctP !== null ? `${shooting.pctP.toFixed(1)}%` : "-"}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {shooting.pm} / {shooting.pa}
              </span>
            </div>
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground flex justify-between">
            <span>
              Rata-rata Gol / Game: <strong>{overall.gfPerGame.toFixed(1)}</strong>
            </span>
            <span>
              Rata-rata Kebobolan: <strong>{overall.gaPerGame.toFixed(1)}</strong>
            </span>
          </div>
        </div>

        {/* Action Totals & Efficiency */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Award size={16} className="text-violet-600 dark:text-violet-400" />
              <span>Efisiensi & Aksi Tim</span>
            </div>
            <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
              Total EFF {totals.eff}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <div className="text-muted-foreground text-[11px]">Rebound</div>
              <div className="text-sm font-bold font-mono mt-0.5">{totals.tot}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                D:{totals.dr} O:{totals.or}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <div className="text-muted-foreground text-[11px]">Assist</div>
              <div className="text-sm font-bold font-mono mt-0.5 text-indigo-600 dark:text-indigo-400">{totals.as}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Umpan Gol</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <div className="text-muted-foreground text-[11px]">Turnover</div>
              <div className="text-sm font-bold font-mono mt-0.5 text-amber-600">{totals.totalTov}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                P:{totals.tov} T:{totals.tovt}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <div className="text-muted-foreground text-[11px]">Pertahanan</div>
              <div className="text-sm font-bold font-mono mt-0.5">{totals.d + totals.it}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                D:{totals.d} IT:{totals.it}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-muted-foreground" />
              <span>Disiplin: {totals.f} Foul</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded font-semibold text-[11px]">
                {totals.yc} Kuning
              </span>
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-600 rounded font-semibold text-[11px]">
                {totals.rc} Merah
              </span>
            </div>
          </div>
        </div>
      </div>

      {scrimmageInternal.matchesPlayed > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-lg border border-border">
          <UsersRound size={15} />
          <span>
            {scrimmageInternal.matchesPlayed} pertandingan scrimmage internal vs internal tidak dihitung pada rekor
            W/L/D di atas.
          </span>
        </div>
      )}
    </div>
  );
}
