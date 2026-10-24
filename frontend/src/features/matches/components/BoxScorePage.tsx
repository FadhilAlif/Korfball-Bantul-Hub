"use client";

import { ArrowLeft, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useBoxScore, useExportMatchReport, useMatch } from "../hooks/useMatches";
import type { TeamBoxScore } from "../types";

interface BoxScorePageProps {
  matchId: number;
}

export function BoxScorePage({ matchId }: BoxScorePageProps) {
  const { data: match } = useMatch(matchId);
  const isLive = match?.status === "LIVE";

  const { data: boxScore, isLoading, isError, refetch } = useBoxScore(matchId, isLive);
  const exportMutation = useExportMatchReport(matchId);

  const handleExport = () => {
    exportMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Menghitung box score pertandingan...</span>
      </div>
    );
  }

  if (isError || !boxScore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-sm text-destructive font-semibold">Gagal memuat box score.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
          <RefreshCw size={14} />
          <span>Coba Lagi</span>
        </Button>
      </div>
    );
  }

  const { home, away, runningScore, logs } = boxScore;
  const periodScores = boxScore.periodScores || boxScore.periods || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top back navigation & export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/matches/${matchId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail Pertandingan</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isLive && (
            <Badge variant="default" className="bg-red-500 text-white animate-pulse gap-1 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              <span>LIVE REFRESH (10s)</span>
            </Badge>
          )}

          <Link
            href={`/matches/${matchId}/report`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}
          >
            <Printer size={14} />
            <span>Format PDF / Cetak</span>
          </Link>

          <Button size="sm" onClick={handleExport} disabled={exportMutation.isPending} className="gap-1.5 text-xs">
            {exportMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Export XLSX</span>
          </Button>
        </div>
      </div>

      {/* Hero Match Score Summary */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {match?.competition || "Statistik Pertandingan Korfball"}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {match?.format} • {match?.type}
            </Badge>
            <span>• Venue: {match?.venue || "Lapangan Korfball"}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-6 py-2">
          {/* Home team */}
          <div className="flex-1 min-w-0 text-right">
            <h3 className="font-bold text-sm sm:text-xl text-foreground flex items-center justify-end gap-1.5 sm:gap-2">
              <span
                className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match?.homeColor || "#FACC15" }}
              />
              <span className="truncate">{home.teamName}</span>
            </h3>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold">HOME</span>
          </div>

          {/* Big Score */}
          <div className="shrink-0 font-black text-2xl sm:text-4xl px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/60 rounded-2xl border border-border tabular-nums text-foreground">
            {home.pts} - {away.pts}
          </div>

          {/* Away team */}
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-bold text-sm sm:text-xl text-foreground flex items-center justify-start gap-1.5 sm:gap-2">
              <span className="truncate">{away.teamName}</span>
              <span
                className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match?.awayColor || "#3B82F6" }}
              />
            </h3>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold">AWAY</span>
          </div>
        </div>

        {/* Skor Babak Summary Strip */}
        <div className="overflow-x-auto min-w-0 w-full pt-2 border-t border-border">
          <table className="w-full min-w-[300px] text-xs text-center border-collapse">
            <thead>
              <tr className="text-muted-foreground text-[11px]">
                <th className="py-1 px-3 text-left">Tim</th>
                {periodScores.map((p) => (
                  <th key={p.period} className="py-1 px-3">
                    {p.periodLabel}
                  </th>
                ))}
                <th className="py-1 px-3 font-bold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-1 px-3 text-left font-semibold text-foreground truncate max-w-[140px]">
                  {home.teamName}
                </td>
                {periodScores.map((p) => (
                  <td key={p.period} className="py-1 px-3 tabular-nums">
                    {p.home}
                  </td>
                ))}
                <td className="py-1 px-3 font-bold tabular-nums text-foreground">{home.pts}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 text-left font-semibold text-foreground truncate max-w-[140px]">
                  {away.teamName}
                </td>
                {periodScores.map((p) => (
                  <td key={p.period} className="py-1 px-3 tabular-nums">
                    {p.away}
                  </td>
                ))}
                <td className="py-1 px-3 font-bold tabular-nums text-foreground">{away.pts}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Statistics Tabs: Home Box Score, Away Box Score, Running Score, Log */}
      <Tabs defaultValue="home" className="flex flex-col gap-4 min-w-0 w-full max-w-full">
        <div className="w-full max-w-full overflow-x-auto pb-1 min-w-0">
          <TabsList className="inline-flex h-10 w-max min-w-full">
            <TabsTrigger value="home" className="gap-2 font-bold text-xs whitespace-nowrap">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match?.homeColor || "#FACC15" }}
              />
              <span>Box Score {home.teamName}</span>
            </TabsTrigger>
            <TabsTrigger value="away" className="gap-2 font-bold text-xs whitespace-nowrap">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match?.awayColor || "#3B82F6" }}
              />
              <span>Box Score {away.teamName}</span>
            </TabsTrigger>
            <TabsTrigger value="running" className="text-xs font-semibold whitespace-nowrap">
              Running Score ({runningScore.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-semibold whitespace-nowrap">
              Log Sub & Timeout ({logs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Home */}
        <TabsContent value="home" className="m-0">
          <TeamBoxScoreTable team={home} />
        </TabsContent>

        {/* Tab Away */}
        <TabsContent value="away" className="m-0">
          <TeamBoxScoreTable team={away} />
        </TabsContent>

        {/* Tab Running Score */}
        <TabsContent value="running" className="m-0">
          <div className="p-4 rounded-2xl bg-card border border-border overflow-x-auto shadow-xs">
            <h4 className="font-bold text-sm mb-3">Histori Running Score</h4>
            {runningScore.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Belum ada skor yang dicatat.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Seq</th>
                    <th className="py-2 px-3">Babak</th>
                    <th className="py-2 px-3">Jam</th>
                    <th className="py-2 px-3">Tim</th>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Pemain</th>
                    <th className="py-2 px-3">Aksi</th>
                    <th className="py-2 px-3 text-right">Skor (H - A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {runningScore.map((row) => (
                    <tr key={row.eventId} className="hover:bg-muted/30">
                      <td className="py-2 px-3 text-muted-foreground">{row.seq}</td>
                      <td className="py-2 px-3">{row.periodLabel}</td>
                      <td className="py-2 px-3">{row.clockFormatted}</td>
                      <td className="py-2 px-3 font-semibold">{row.side === "HOME" ? "HOME" : "AWAY"}</td>
                      <td className="py-2 px-3 font-bold">#{row.jerseyNumber ?? "-"}</td>
                      <td className="py-2 px-3 font-sans font-medium">{row.athleteName}</td>
                      <td className="py-2 px-3 font-sans">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {row.actionLabel}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-foreground">
                        {row.homeScore} - {row.awayScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Tab Logs */}
        <TabsContent value="logs" className="m-0">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <h4 className="font-bold text-sm mb-3">Catatan Substitusi & Time-out</h4>
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Belum ada catatan pergantian pemain atau time-out.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {logs.map((log) => (
                  <div
                    key={log.eventId}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border text-xs"
                  >
                    <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                      {log.periodLabel} {log.clockFormatted}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
                      {log.type}
                    </Badge>
                    <span className="font-semibold text-foreground shrink-0">
                      {log.side === "HOME" ? "HOME" : "AWAY"}
                    </span>
                    <span className="text-muted-foreground">{log.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamBoxScoreTable({ team }: { team: TeamBoxScore }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs flex flex-col min-w-0 w-full max-w-full">
      <div className="p-3.5 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-foreground truncate">{team.teamName}</span>
          {team.coach && <span className="text-muted-foreground truncate">• Coach: {team.coach}</span>}
        </div>
        <div className="flex items-center gap-3 font-semibold shrink-0">
          <span>PTS: {team.pts}</span>
          <span>EFF: {team.eff}</span>
          <span>TOVT: {team.tovt}</span>
        </div>
      </div>

      <div className="overflow-x-auto w-full min-w-0">
        <table className="w-full min-w-[700px] text-xs text-right border-collapse">
          <thead className="bg-muted/70 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border-b border-border">
            <tr>
              <th className="py-2 px-2 text-center w-8 sticky left-0 bg-muted/90 z-10">No</th>
              <th className="py-2 px-3 text-left min-w-[140px] sticky left-8 bg-muted/90 z-10">Pemain</th>
              <th className="py-2 px-1.5 text-center w-8">L/P</th>
              <th className="py-2 px-1.5">SM</th>
              <th className="py-2 px-1.5">SA</th>
              <th className="py-2 px-1.5">%FGS</th>
              <th className="py-2 px-1.5">RIM</th>
              <th className="py-2 px-1.5">RIA</th>
              <th className="py-2 px-1.5">%FGR</th>
              <th className="py-2 px-1.5">PM</th>
              <th className="py-2 px-1.5">PA</th>
              <th className="py-2 px-1.5">%P</th>
              <th className="py-2 px-1.5">DR</th>
              <th className="py-2 px-1.5">OR</th>
              <th className="py-2 px-1.5 font-bold">TOT</th>
              <th className="py-2 px-1.5">D</th>
              <th className="py-2 px-1.5">AS</th>
              <th className="py-2 px-1.5">IT</th>
              <th className="py-2 px-1.5">TOV</th>
              <th className="py-2 px-1.5">F</th>
              <th className="py-2 px-1.5">YC</th>
              <th className="py-2 px-1.5">RC</th>
              <th className="py-2 px-2 font-bold text-foreground">PTS</th>
              <th className="py-2 px-2 font-bold text-foreground">EFF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums font-mono text-[11px]">
            {team.players.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="py-2 px-2 text-center font-bold sticky left-0 bg-card z-10">#{p.jerseyNumber}</td>
                <td className="py-2 px-3 text-left font-sans font-medium text-foreground truncate max-w-[160px] sticky left-8 bg-card z-10">
                  {p.athleteName}
                  {p.isStarter && <span className="text-[9px] text-muted-foreground ml-1">*</span>}
                </td>
                <td className="py-2 px-1.5 text-center font-bold">{p.sexLabel}</td>
                <td className="py-2 px-1.5">{p.sm}</td>
                <td className="py-2 px-1.5">{p.sa}</td>
                <td className="py-2 px-1.5 text-muted-foreground">{p.pctFgsFormatted}</td>
                <td className="py-2 px-1.5">{p.rim}</td>
                <td className="py-2 px-1.5">{p.ria}</td>
                <td className="py-2 px-1.5 text-muted-foreground">{p.pctFgrFormatted}</td>
                <td className="py-2 px-1.5">{p.pm}</td>
                <td className="py-2 px-1.5">{p.pa}</td>
                <td className="py-2 px-1.5 text-muted-foreground">{p.pctPFormatted}</td>
                <td className="py-2 px-1.5">{p.dr}</td>
                <td className="py-2 px-1.5">{p.or}</td>
                <td className="py-2 px-1.5 font-bold">{p.tot}</td>
                <td className="py-2 px-1.5">{p.d}</td>
                <td className="py-2 px-1.5">{p.as}</td>
                <td className="py-2 px-1.5">{p.it}</td>
                <td className="py-2 px-1.5 text-amber-600">{p.tov}</td>
                <td className="py-2 px-1.5 text-rose-600">{p.f}</td>
                <td className="py-2 px-1.5">{p.yc}</td>
                <td className="py-2 px-1.5 text-red-600">{p.rc}</td>
                <td className="py-2 px-2 font-bold text-foreground text-xs">{p.pts}</td>
                <td className="py-2 px-2 font-bold text-foreground text-xs">{p.eff}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/80 font-mono font-bold text-[11px] border-t-2 border-border text-foreground">
            <tr>
              <td colSpan={2} className="py-2 px-3 text-left font-sans sticky left-0 bg-muted/90 z-10 uppercase">
                Total Tim
              </td>
              <td className="py-2 px-1.5 text-center">-</td>
              <td className="py-2 px-1.5">{team.sm}</td>
              <td className="py-2 px-1.5">{team.sa}</td>
              <td className="py-2 px-1.5">{team.pctFgsFormatted}</td>
              <td className="py-2 px-1.5">{team.rim}</td>
              <td className="py-2 px-1.5">{team.ria}</td>
              <td className="py-2 px-1.5">{team.pctFgrFormatted}</td>
              <td className="py-2 px-1.5">{team.pm}</td>
              <td className="py-2 px-1.5">{team.pa}</td>
              <td className="py-2 px-1.5">{team.pctPFormatted}</td>
              <td className="py-2 px-1.5">{team.dr}</td>
              <td className="py-2 px-1.5">{team.or}</td>
              <td className="py-2 px-1.5">{team.tot}</td>
              <td className="py-2 px-1.5">{team.d}</td>
              <td className="py-2 px-1.5">{team.as}</td>
              <td className="py-2 px-1.5">{team.it}</td>
              <td className="py-2 px-1.5">{team.tov}</td>
              <td className="py-2 px-1.5">{team.f}</td>
              <td className="py-2 px-1.5">{team.yc}</td>
              <td className="py-2 px-1.5">{team.rc}</td>
              <td className="py-2 px-2 text-xs">{team.pts}</td>
              <td className="py-2 px-2 text-xs">{team.eff}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
