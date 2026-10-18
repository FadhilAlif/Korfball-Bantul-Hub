"use client";

import { ArrowLeft, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { useBoxScore, useExportMatchReport, useMatch } from "../hooks/useMatches";
import type { TeamBoxScore } from "../types";

interface MatchReportPageProps {
  matchId: number;
}

export function MatchReportPage({ matchId }: MatchReportPageProps) {
  const { data: match } = useMatch(matchId);
  const { data: boxScore, isLoading, isError, refetch } = useBoxScore(matchId, false);
  const exportMutation = useExportMatchReport(matchId);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 print:hidden">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Menyiapkan laporan resmi pertandingan...</span>
      </div>
    );
  }

  if (isError || !boxScore || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 print:hidden">
        <p className="text-sm text-destructive font-semibold">Gagal memuat laporan pertandingan.</p>
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
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/matches/${matchId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail Pertandingan</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/matches/${matchId}/box-score`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "text-xs" })}
          >
            Box Score Interaktif
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="gap-1.5 text-xs"
          >
            {exportMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Export XLSX</span>
          </Button>

          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer size={14} />
            <span>Cetak / Simpan PDF (A4 Landscape)</span>
          </Button>
        </div>
      </div>

      {/* Official Korfball Match Sheet (Print Canvas) */}
      <div className="bg-card print:bg-white text-foreground print:text-black p-4 sm:p-8 rounded-2xl border print:border-none border-border shadow-xs print:shadow-none flex flex-col gap-6 print:m-0 print:p-0">
        {/* Document Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-black/80 dark:border-border">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden border border-border">
              <Image
                src="/Korfball Bantul Logo.jpg"
                alt="Korfball Bantul Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tight uppercase leading-none">
                Lembar Pertandingan Resmi Korfball
              </h1>
              <p className="text-xs font-semibold text-muted-foreground print:text-black/70 mt-1">
                PENGKAB KORFBALL BANTUL • {match.competition || "TOURNAMENT SERIES 2026"}
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-sm uppercase">Format {match.format}</div>
            <div className="text-muted-foreground print:text-black/70">
              {match.gameNumber || `Match #${match.id}`} • {match.type}
            </div>
          </div>
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 print:bg-slate-50 p-3 rounded-xl border border-border print:border-black/30">
          <div>
            <span className="font-bold text-muted-foreground print:text-black/70 block">Tanggal:</span>
            <span className="font-semibold">{formatDate(match.scheduledAt)}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-black/70 block">Lokasi:</span>
            <span className="font-semibold">{match.venue || "GOR Dwi Windu Bantul"}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-black/70 block">Wasit:</span>
            <span>{match.referees || "—"}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-black/70 block">Ketua Juri:</span>
            <span>{match.juryChair || "—"}</span>
          </div>
        </div>

        {/* Big Final Score Banner */}
        <div className="flex items-center justify-between p-4 bg-muted/40 print:bg-slate-100 rounded-xl border border-border print:border-black/40">
          <div className="flex-1 text-center sm:text-right">
            <span className="text-xs font-bold text-muted-foreground uppercase block">HOME TEAM</span>
            <span className="font-black text-lg sm:text-2xl">{home.teamName}</span>
          </div>

          <div className="px-6 py-2 bg-card print:bg-white rounded-xl border border-border print:border-black/40 font-black text-3xl sm:text-4xl tabular-nums shadow-xs">
            {home.pts} - {away.pts}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-bold text-muted-foreground uppercase block">AWAY TEAM</span>
            <span className="font-black text-lg sm:text-2xl">{away.teamName}</span>
          </div>
        </div>

        {/* Skor Babak Table */}
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-xs uppercase tracking-wider">Ringkasan Skor Babak</span>
          <table className="w-full text-xs text-center border-collapse border border-border print:border-black/50">
            <thead className="bg-muted/60 print:bg-slate-200 text-muted-foreground print:text-black font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1 px-3 text-left border border-border print:border-black/40">Tim</th>
                {periodScores.map((p) => (
                  <th key={p.period} className="py-1 px-3 border border-border print:border-black/40">
                    {p.periodLabel}
                  </th>
                ))}
                <th className="py-1 px-3 font-bold border border-border print:border-black/40">Total Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              <tr>
                <td className="py-1 px-3 text-left font-sans font-semibold border border-border print:border-black/40">
                  {home.teamName}
                </td>
                {periodScores.map((p) => (
                  <td key={p.period} className="py-1 px-3 border border-border print:border-black/40">
                    {p.home}
                  </td>
                ))}
                <td className="py-1 px-3 font-bold text-sm border border-border print:border-black/40">{home.pts}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 text-left font-sans font-semibold border border-border print:border-black/40">
                  {away.teamName}
                </td>
                {periodScores.map((p) => (
                  <td key={p.period} className="py-1 px-3 border border-border print:border-black/40">
                    {p.away}
                  </td>
                ))}
                <td className="py-1 px-3 font-bold text-sm border border-border print:border-black/40">{away.pts}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Box Score Home Team */}
        <PrintBoxScoreTable team={home} label="HOME" />

        {/* Box Score Away Team */}
        <div className="print:break-before-page pt-4">
          <PrintBoxScoreTable team={away} label="AWAY" />
        </div>

        {/* Running score & logs preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          {/* Running score */}
          <div className="flex flex-col gap-1.5 border border-border print:border-black/40 rounded-xl p-3">
            <span className="font-bold text-xs uppercase tracking-wider">Histori Gol (Running Score)</span>
            <div className="max-h-48 overflow-y-auto print:max-h-none">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="text-muted-foreground print:text-black/70 border-b border-border text-[9px] uppercase font-semibold">
                  <tr>
                    <th className="py-1">Seq</th>
                    <th className="py-1">Waktu</th>
                    <th className="py-1">Tim</th>
                    <th className="py-1">Pemain</th>
                    <th className="py-1 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {runningScore.map((r) => (
                    <tr key={r.eventId}>
                      <td className="py-0.5">{r.seq}</td>
                      <td className="py-0.5">
                        {r.periodLabel} {r.clockFormatted}
                      </td>
                      <td className="py-0.5 font-bold">{r.side === "HOME" ? "HOME" : "AWAY"}</td>
                      <td className="py-0.5 font-sans truncate max-w-[100px]">
                        #{r.jerseyNumber} {r.athleteName}
                      </td>
                      <td className="py-0.5 text-right font-bold">
                        {r.homeScore}-{r.awayScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Substitution & Timeout log */}
          <div className="flex flex-col gap-1.5 border border-border print:border-black/40 rounded-xl p-3">
            <span className="font-bold text-xs uppercase tracking-wider">Log Substitusi & Time-out</span>
            <div className="max-h-48 overflow-y-auto print:max-h-none flex flex-col gap-1 text-[11px]">
              {logs.length === 0 ? (
                <span className="text-muted-foreground italic">Tidak ada catatan pergantian pemain atau time-out.</span>
              ) : (
                logs.map((l) => (
                  <div key={l.eventId} className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground">
                      [{l.periodLabel} {l.clockFormatted}]
                    </span>
                    <span className="font-bold font-sans">{l.side}:</span>
                    <span className="font-sans text-muted-foreground print:text-black">{l.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Official Signatures Grid */}
        <div className="grid grid-cols-4 gap-4 pt-8 text-center text-xs">
          <div className="flex flex-col justify-end h-24">
            <div className="border-b border-black/80 dark:border-border pb-1 font-semibold">
              {match.referees || "( .................................... )"}
            </div>
            <span className="text-[10px] text-muted-foreground print:text-black mt-1">Wasit Pertandingan</span>
          </div>

          <div className="flex flex-col justify-end h-24">
            <div className="border-b border-black/80 dark:border-border pb-1 font-semibold">
              {match.juryChair || "( .................................... )"}
            </div>
            <span className="text-[10px] text-muted-foreground print:text-black mt-1">Ketua Juri Meja</span>
          </div>

          <div className="flex flex-col justify-end h-24">
            <div className="border-b border-black/80 dark:border-border pb-1 font-semibold">
              {home.coach || "( .................................... )"}
            </div>
            <span className="text-[10px] text-muted-foreground print:text-black mt-1">
              Official Tim {home.teamName}
            </span>
          </div>

          <div className="flex flex-col justify-end h-24">
            <div className="border-b border-black/80 dark:border-border pb-1 font-semibold">
              {away.coach || "( .................................... )"}
            </div>
            <span className="text-[10px] text-muted-foreground print:text-black mt-1">
              Official Tim {away.teamName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintBoxScoreTable({ team, label }: { team: TeamBoxScore; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider">
          Box Score: {team.teamName} ({label})
        </span>
        <div className="font-mono text-[11px] flex items-center gap-3">
          <span>
            PTS: <strong>{team.pts}</strong>
          </span>
          <span>
            EFF: <strong>{team.eff}</strong>
          </span>
          <span>
            TOVT: <strong>{team.tovt}</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] text-right border-collapse border border-border print:border-black/50">
          <thead className="bg-muted/70 print:bg-slate-200 text-muted-foreground print:text-black font-semibold uppercase text-[9px] border-b border-border print:border-black/50">
            <tr>
              <th className="py-1 px-1 text-center w-6 border border-border print:border-black/40">No</th>
              <th className="py-1 px-2 text-left min-w-[120px] border border-border print:border-black/40">Pemain</th>
              <th className="py-1 px-1 text-center w-6 border border-border print:border-black/40">L/P</th>
              <th className="py-1 px-1 border border-border print:border-black/40">SM</th>
              <th className="py-1 px-1 border border-border print:border-black/40">SA</th>
              <th className="py-1 px-1 border border-border print:border-black/40">%FGS</th>
              <th className="py-1 px-1 border border-border print:border-black/40">RIM</th>
              <th className="py-1 px-1 border border-border print:border-black/40">RIA</th>
              <th className="py-1 px-1 border border-border print:border-black/40">%FGR</th>
              <th className="py-1 px-1 border border-border print:border-black/40">PM</th>
              <th className="py-1 px-1 border border-border print:border-black/40">PA</th>
              <th className="py-1 px-1 border border-border print:border-black/40">%P</th>
              <th className="py-1 px-1 border border-border print:border-black/40">DR</th>
              <th className="py-1 px-1 border border-border print:border-black/40">OR</th>
              <th className="py-1 px-1 font-bold border border-border print:border-black/40">TOT</th>
              <th className="py-1 px-1 border border-border print:border-black/40">D</th>
              <th className="py-1 px-1 border border-border print:border-black/40">AS</th>
              <th className="py-1 px-1 border border-border print:border-black/40">IT</th>
              <th className="py-1 px-1 border border-border print:border-black/40">TOV</th>
              <th className="py-1 px-1 border border-border print:border-black/40">F</th>
              <th className="py-1 px-1 border border-border print:border-black/40">YC</th>
              <th className="py-1 px-1 border border-border print:border-black/40">RC</th>
              <th className="py-1 px-1.5 font-bold border border-border print:border-black/40">PTS</th>
              <th className="py-1 px-1.5 font-bold border border-border print:border-black/40">EFF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border print:divide-black/30 font-mono text-[10px]">
            {team.players.map((p) => (
              <tr key={p.id}>
                <td className="py-1 px-1 text-center font-bold border border-border print:border-black/40">
                  #{p.jerseyNumber}
                </td>
                <td className="py-1 px-2 text-left font-sans font-medium truncate max-w-[140px] border border-border print:border-black/40">
                  {p.athleteName}
                  {p.isStarter && <span className="text-[8px] text-muted-foreground ml-0.5">*</span>}
                </td>
                <td className="py-1 px-1 text-center font-bold border border-border print:border-black/40">
                  {p.sexLabel}
                </td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.sm}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.sa}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.pctFgsFormatted}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.rim}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.ria}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.pctFgrFormatted}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.pm}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.pa}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.pctPFormatted}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.dr}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.or}</td>
                <td className="py-1 px-1 font-bold border border-border print:border-black/40">{p.tot}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.d}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.as}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.it}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.tov}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.f}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.yc}</td>
                <td className="py-1 px-1 border border-border print:border-black/40">{p.rc}</td>
                <td className="py-1 px-1.5 font-bold text-xs border border-border print:border-black/40">{p.pts}</td>
                <td className="py-1 px-1.5 font-bold text-xs border border-border print:border-black/40">{p.eff}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/80 print:bg-slate-200 font-mono font-bold text-[10px] border-t-2 border-border print:border-black/50">
            <tr>
              <td
                colSpan={2}
                className="py-1 px-2 text-left font-sans uppercase border border-border print:border-black/40"
              >
                Total Tim
              </td>
              <td className="py-1 px-1 text-center border border-border print:border-black/40">-</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.sm}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.sa}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.pctFgsFormatted}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.rim}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.ria}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.pctFgrFormatted}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.pm}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.pa}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.pctPFormatted}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.dr}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.or}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.tot}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.d}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.as}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.it}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.tov}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.f}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.yc}</td>
              <td className="py-1 px-1 border border-border print:border-black/40">{team.rc}</td>
              <td className="py-1 px-1.5 text-xs border border-border print:border-black/40">{team.pts}</td>
              <td className="py-1 px-1.5 text-xs border border-border print:border-black/40">{team.eff}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
