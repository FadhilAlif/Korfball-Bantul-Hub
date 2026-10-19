"use client";

import { ArrowLeft, Award, ChevronRight, Flame, Shield, Target, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { formatWibDate } from "@/shared/lib/format-date";
import type { PlayerProfileStats } from "../types";

interface PlayerProfilePageProps {
  data: PlayerProfileStats;
  backHref?: string;
  isSelf?: boolean;
}

export function PlayerProfilePage({ data, backHref = "/stats", isSelf = false }: PlayerProfilePageProps) {
  const { athlete, summary, gameLogs, effTrend } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke {backHref === "/stats" ? "Statistik" : "Dashboard"}</span>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
            {athlete.jerseyNumber !== null ? (
              <span className="font-mono">#{athlete.jerseyNumber}</span>
            ) : (
              <User size={30} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{athlete.fullName}</h1>
              {athlete.nickname && (
                <span className="text-sm font-medium text-muted-foreground">({athlete.nickname})</span>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${
                  athlete.sex === "MALE"
                    ? "border-sky-500/40 text-sky-600 bg-sky-50 dark:bg-sky-950/30"
                    : "border-pink-500/40 text-pink-600 bg-pink-50 dark:bg-pink-950/30"
                }`}
              >
                {athlete.sex === "MALE" ? "Laki-laki" : "Perempuan"}
              </Badge>
              {isSelf && (
                <Badge variant="default" className="text-xs">
                  Profil Saya
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{athlete.teamName}</span>
              <span>•</span>
              <span
                className={`font-medium ${
                  athlete.status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {athlete.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
          <div className="p-2 sm:p-2.5 rounded-lg bg-muted/30 border border-border/70">
            <div className="text-[11px] text-muted-foreground font-medium">GP</div>
            <div className="text-lg font-bold font-mono mt-0.5">{summary.gp}</div>
          </div>
          <div className="p-2 sm:p-2.5 rounded-lg bg-muted/30 border border-border/70">
            <div className="text-[11px] text-muted-foreground font-medium">PTS (PPG)</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              {summary.pts}{" "}
              <span className="text-xs font-normal text-muted-foreground">({summary.ppg.toFixed(1)})</span>
            </div>
          </div>
          <div className="p-2 sm:p-2.5 rounded-lg bg-muted/30 border border-border/70">
            <div className="text-[11px] text-muted-foreground font-medium">EFF (EPG)</div>
            <div className="text-lg font-bold font-mono text-violet-600 dark:text-violet-400 mt-0.5">
              {summary.eff}{" "}
              <span className="text-xs font-normal text-muted-foreground">({summary.epg.toFixed(1)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Target size={15} className="text-primary" />
            <span>Akurasi Tembakan</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{summary.pctFgTotalFormatted}</div>
          <div className="text-[11px] text-muted-foreground font-mono mt-1">
            {summary.sm + summary.rim + summary.pm} / {summary.sa + summary.ria + summary.pa} FG
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Award size={15} className="text-amber-500" />
            <span>Rebounds (RPG)</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {summary.tot}{" "}
            <span className="text-xs font-normal text-muted-foreground">({summary.rpg.toFixed(1)}/g)</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-1">
            DR: {summary.dr} | OR: {summary.or}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Flame size={15} className="text-indigo-500" />
            <span>Assists (APG)</span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {summary.as} <span className="text-xs font-normal text-muted-foreground">({summary.apg.toFixed(1)}/g)</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-1">TOV: {summary.tov}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Shield size={15} className="text-emerald-500" />
            <span>Pertahanan</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{summary.d + summary.it}</div>
          <div className="text-[11px] text-muted-foreground font-mono mt-1">
            Dek: {summary.d} | Intercept: {summary.it}
          </div>
        </div>
      </div>

      {/* EFF & PTS Trend */}
      {effTrend.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Tren Efisiensi & Poin (Match ke Match)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Riwayat performa per pertandingan berurutan secara kronologis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {effTrend.map((t, idx) => {
              const dateStr = formatWibDate(t.scheduledAt, {
                day: "numeric",
                month: "short",
              });
              return (
                <Link
                  key={t.matchId}
                  href={`/matches/${t.matchId}/box-score`}
                  className="p-3 bg-muted/30 border border-border rounded-lg hover:border-primary/50 transition-colors flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>G{idx + 1}</span>
                    <span>{dateStr}</span>
                  </div>
                  <div className="my-2">
                    <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      vs {t.opponentTeam}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-border/70">
                    <span className="font-bold text-primary">{t.pts} PTS</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400">EFF {t.eff}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Logs Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Game Log Pertandingan ({gameLogs.length})</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rincian statistik per pertandingan yang diikuti</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Tanggal</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground">Lawan</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground whitespace-nowrap">
                  Hasil / Skor
                </th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">Pos</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground font-bold">PTS</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">SM/SA</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">%FGS</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">RIM/RIA</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">%FGR</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">PM/PA</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">%P</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">%FG</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">TOT</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">D</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">AS</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">IT</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">TOV</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">F</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">YC</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground">RC</th>
                <th className="px-2.5 py-2.5 font-semibold text-center text-muted-foreground font-bold">EFF</th>
                <th className="w-8 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {gameLogs.length === 0 ? (
                <tr>
                  <td colSpan={22} className="text-center py-10 font-sans text-muted-foreground">
                    Belum ada pertandingan tercatat untuk atlet ini.
                  </td>
                </tr>
              ) : (
                gameLogs.map((log) => {
                  const dateStr = formatWibDate(log.scheduledAt, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <tr key={log.matchId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap font-sans text-foreground">{dateStr}</td>
                      <td className="px-3 py-2.5 font-sans font-medium text-foreground">
                        <Link
                          href={`/matches/${log.matchId}/box-score`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>vs {log.opponentTeamName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({log.side})</span>
                        </Link>
                      </td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            log.result === "W"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : log.result === "L"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span>{log.result}</span>
                          <span>
                            {log.teamScore}-{log.opponentScore}
                          </span>
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-sans">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {log.isStarter ? "Starter" : log.played ? "Sub" : "DNP"}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-bold text-primary">{log.pts}</td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap text-[11px]">
                        {log.sm}/{log.sa}
                      </td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground">
                        {log.pctFgs !== null ? `${Math.round(log.pctFgs)}%` : "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap text-[11px]">
                        {log.rim}/{log.ria}
                      </td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground">
                        {log.pctFgr !== null ? `${Math.round(log.pctFgr)}%` : "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground whitespace-nowrap text-[11px]">
                        {log.pm}/{log.pa}
                      </td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground">
                        {log.pctP !== null ? `${Math.round(log.pctP)}%` : "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-medium">
                        {log.pctFg !== null ? `${Math.round(log.pctFg)}%` : "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-semibold text-foreground">{log.tot}</td>
                      <td className="px-2.5 py-2.5 text-center">{log.d}</td>
                      <td className="px-2.5 py-2.5 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.as}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">{log.it}</td>
                      <td className="px-2.5 py-2.5 text-center text-amber-600">{log.tov}</td>
                      <td className="px-2.5 py-2.5 text-center text-muted-foreground">{log.f}</td>
                      <td className="px-2.5 py-2.5 text-center">
                        {log.yc > 0 ? (
                          <span className="px-1 bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded font-semibold">
                            {log.yc}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        {log.rc > 0 ? (
                          <span className="px-1 bg-red-500/20 text-red-600 rounded font-semibold">{log.rc}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-bold text-violet-600 dark:text-violet-400">
                        {log.eff}
                      </td>
                      <td className="px-2 py-2.5 text-right font-sans">
                        <Link
                          href={`/matches/${log.matchId}/box-score`}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-1"
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
      </div>
    </div>
  );
}
