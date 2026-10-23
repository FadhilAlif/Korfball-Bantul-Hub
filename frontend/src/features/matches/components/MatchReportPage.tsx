"use client";

import { ArrowLeft, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { formatWibDate } from "@/shared/lib/format-date";
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

  const formatDate = (isoString?: string) =>
    isoString ? formatWibDate(isoString, { weekday: "long", month: "long" }) : "-";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href={`/matches/${matchId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail Pertandingan</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
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
      <div className="bg-card print:bg-white text-foreground print:text-black p-4 sm:p-8 rounded-2xl border print:border-none border-border shadow-xs print:shadow-none flex flex-col gap-6 print:gap-3 print:m-0 print:p-0">
        {/* Document Header (Page 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 print:pb-2 border-b-2 border-slate-900 print:border-black">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 sm:w-14 h-12 sm:h-14 print:w-11 print:h-11 shrink-0 rounded-full overflow-hidden border border-border print:border-slate-400">
              <Image
                src="/Korfball Bantul Logo.jpg"
                alt="Korfball Bantul Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-xl print:text-base tracking-tight uppercase leading-tight print:text-black">
                Lembar Pertandingan Resmi Korfball
              </h1>
              <p className="text-[11px] sm:text-xs print:text-[8pt] font-semibold text-muted-foreground print:text-slate-700 mt-1 truncate">
                PENGKAB KORFBALL BANTUL • {match.competition || "TOURNAMENT SERIES 2026"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs print:text-[8pt] shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
            <div className="font-bold text-sm print:text-[10pt] uppercase print:text-black">Format {match.format}</div>
            <div className="text-muted-foreground print:text-slate-700 font-medium">
              {match.gameNumber || `Match #${match.id}`} • {match.type}
            </div>
          </div>
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs print:text-[8pt] bg-muted/20 print:bg-slate-50 p-2.5 rounded-xl border border-border print:border-slate-800 print:text-black">
          <div>
            <span className="font-bold text-muted-foreground print:text-slate-600 block text-[10px] print:text-[7pt] uppercase">
              Tanggal:
            </span>
            <span className="font-semibold">{formatDate(match.scheduledAt)}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-slate-600 block text-[10px] print:text-[7pt] uppercase">
              Lokasi / Venue:
            </span>
            <span className="font-semibold">{match.venue || "GOR Dwi Windu Bantul"}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-slate-600 block text-[10px] print:text-[7pt] uppercase">
              Wasit:
            </span>
            <span className="font-semibold">{match.referees || "—"}</span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground print:text-slate-600 block text-[10px] print:text-[7pt] uppercase">
              Ketua Juri Meja:
            </span>
            <span className="font-semibold">{match.juryChair || "—"}</span>
          </div>
        </div>

        {/* Big Final Score Banner */}
        <div className="flex items-center justify-between p-3.5 print:p-2 bg-muted/40 print:bg-slate-50 rounded-xl border border-border print:border-slate-800 gap-2">
          <div className="flex-1 min-w-0 text-center sm:text-right">
            <span className="text-[10px] print:text-[7.5pt] font-bold text-muted-foreground print:text-slate-600 uppercase block">
              HOME TEAM
            </span>
            <span className="font-black text-base sm:text-xl print:text-base print:text-black truncate block">
              {home.teamName}
            </span>
          </div>

          <div className="shrink-0 px-3 sm:px-5 py-1.5 bg-card print:bg-white rounded-xl border border-border print:border-slate-800 font-black text-xl sm:text-3xl print:text-2xl tabular-nums shadow-xs print:shadow-none print:text-black mx-1 sm:mx-4">
            {home.pts} - {away.pts}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <span className="text-[10px] print:text-[7.5pt] font-bold text-muted-foreground print:text-slate-600 uppercase block">
              AWAY TEAM
            </span>
            <span className="font-black text-base sm:text-xl print:text-base print:text-black truncate block">
              {away.teamName}
            </span>
          </div>
        </div>

        {/* Skor Babak Table */}
        <div className="flex flex-col gap-1 print:gap-0.5 overflow-x-auto min-w-0 w-full">
          <span className="font-bold text-xs print:text-[8pt] uppercase tracking-wider print:text-black">
            Ringkasan Skor Babak
          </span>
          <table className="w-full min-w-[320px] print:min-w-0 text-xs print:text-[7.5pt] text-center border-collapse border border-border print:border-slate-800">
            <thead className="bg-muted/60 print:bg-slate-100 text-muted-foreground print:text-black font-semibold text-[10px] print:text-[7pt] uppercase">
              <tr>
                <th className="py-1 px-3 print:py-0.5 print:px-2 text-left border border-border print:border-slate-600">
                  Tim
                </th>
                {periodScores.map((p) => (
                  <th
                    key={p.period}
                    className="py-1 px-3 print:py-0.5 print:px-2 border border-border print:border-slate-600"
                  >
                    {p.periodLabel}
                  </th>
                ))}
                <th className="py-1 px-3 print:py-0.5 print:px-2 font-bold border border-border print:border-slate-600">
                  Total Skor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border print:divide-slate-300 font-mono">
              <tr>
                <td className="py-1 px-3 print:py-0.5 print:px-2 text-left font-sans font-semibold border border-border print:border-slate-600 print:text-black">
                  {home.teamName}
                </td>
                {periodScores.map((p) => (
                  <td
                    key={p.period}
                    className="py-1 px-3 print:py-0.5 print:px-2 border border-border print:border-slate-600 print:text-black"
                  >
                    {p.home}
                  </td>
                ))}
                <td className="py-1 px-3 print:py-0.5 print:px-2 font-bold text-sm print:text-[8pt] border border-border print:border-slate-600 print:text-black">
                  {home.pts}
                </td>
              </tr>
              <tr>
                <td className="py-1 px-3 print:py-0.5 print:px-2 text-left font-sans font-semibold border border-border print:border-slate-600 print:text-black">
                  {away.teamName}
                </td>
                {periodScores.map((p) => (
                  <td
                    key={p.period}
                    className="py-1 px-3 print:py-0.5 print:px-2 border border-border print:border-slate-600 print:text-black"
                  >
                    {p.away}
                  </td>
                ))}
                <td className="py-1 px-3 print:py-0.5 print:px-2 font-bold text-sm print:text-[8pt] border border-border print:border-slate-600 print:text-black">
                  {away.pts}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Box Score Home Team (Ends Page 1) */}
        <PrintBoxScoreTable team={home} label="HOME" />

        {/* Page Break: Start Page 2 (Away Team & Match Summary) */}
        <div className="print:break-before-page pt-4 print:pt-0 flex flex-col gap-3">
          {/* Page 2 Mini Header (visible on print only) */}
          <div className="hidden print:flex items-center justify-between pb-1 mb-1 border-b-2 border-slate-900 text-xs font-semibold print:text-black">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-tight text-[8.5pt]">
                Lembar Pertandingan Resmi Korfball
              </span>
              <span className="text-[7.5pt] text-slate-600">• Halaman 2 (Away Team & Catatan Resmi)</span>
            </div>
            <div className="font-mono text-[7.5pt]">
              {match.gameNumber || `Match #${match.id}`} | {home.teamName} vs {away.teamName}
            </div>
          </div>

          {/* Box Score Away Team */}
          <PrintBoxScoreTable team={away} label="AWAY" />

          {/* Running score & logs preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 print:gap-2.5 print:pt-0">
            {/* Running score */}
            <div className="flex flex-col gap-1.5 border border-border print:border-slate-800 rounded-xl p-3 print:p-2 print:rounded-lg print:break-inside-avoid">
              <span className="font-bold text-xs print:text-[8pt] uppercase tracking-wider print:text-black">
                Histori Gol (Running Score)
              </span>
              <div className="max-h-48 overflow-y-auto print:max-h-none print:overflow-visible">
                <table className="w-full text-[11px] print:text-[7pt] text-left border-collapse">
                  <thead className="text-muted-foreground print:text-black font-semibold border-b border-border print:border-slate-600 text-[9px] print:text-[6.5pt] uppercase">
                    <tr>
                      <th className="py-1 print:py-0.5">Seq</th>
                      <th className="py-1 print:py-0.5">Waktu</th>
                      <th className="py-1 print:py-0.5">Tim</th>
                      <th className="py-1 print:py-0.5">Pemain</th>
                      <th className="py-1 print:py-0.5 text-right">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border print:divide-slate-300 font-mono">
                    {runningScore.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-2 text-center text-muted-foreground italic font-sans text-xs">
                          Belum ada catatan gol.
                        </td>
                      </tr>
                    ) : (
                      runningScore.map((r) => (
                        <tr key={r.eventId}>
                          <td className="py-0.5">{r.seq}</td>
                          <td className="py-0.5">
                            {r.periodLabel} {r.clockFormatted}
                          </td>
                          <td className="py-0.5 font-bold">{r.side === "HOME" ? "HOME" : "AWAY"}</td>
                          <td className="py-0.5 font-sans truncate max-w-[100px] print:max-w-none">
                            #{r.jerseyNumber} {r.athleteName}
                          </td>
                          <td className="py-0.5 text-right font-bold">
                            {r.homeScore}-{r.awayScore}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Substitution & Timeout log */}
            <div className="flex flex-col gap-1.5 border border-border print:border-slate-800 rounded-xl p-3 print:p-2 print:rounded-lg print:break-inside-avoid">
              <span className="font-bold text-xs print:text-[8pt] uppercase tracking-wider print:text-black">
                Log Substitusi & Time-out
              </span>
              <div className="max-h-48 overflow-y-auto print:max-h-none print:overflow-visible flex flex-col gap-1 text-[11px] print:text-[7pt]">
                {logs.length === 0 ? (
                  <span className="text-muted-foreground italic text-xs">
                    Tidak ada catatan pergantian pemain atau time-out.
                  </span>
                ) : (
                  logs.map((l) => (
                    <div key={l.eventId} className="flex items-center gap-2 font-mono">
                      <span className="text-muted-foreground print:text-slate-600">
                        [{l.periodLabel} {l.clockFormatted}]
                      </span>
                      <span className="font-bold font-sans print:text-black">{l.side}:</span>
                      <span className="font-sans text-muted-foreground print:text-black">{l.description}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Official Signatures Grid */}
          <div className="grid grid-cols-4 gap-4 pt-6 print:pt-4 text-center text-xs print:text-[7.5pt] print:break-inside-avoid">
            <div className="flex flex-col justify-end h-20 print:h-16">
              <div className="border-b border-black/80 print:border-black pb-1 font-semibold print:text-black">
                {match.referees || "( .................................... )"}
              </div>
              <span className="text-[10px] print:text-[7pt] text-muted-foreground print:text-slate-700 mt-1">
                Wasit Pertandingan
              </span>
            </div>

            <div className="flex flex-col justify-end h-20 print:h-16">
              <div className="border-b border-black/80 print:border-black pb-1 font-semibold print:text-black">
                {match.juryChair || "( .................................... )"}
              </div>
              <span className="text-[10px] print:text-[7pt] text-muted-foreground print:text-slate-700 mt-1">
                Ketua Juri Meja
              </span>
            </div>

            <div className="flex flex-col justify-end h-20 print:h-16">
              <div className="border-b border-black/80 print:border-black pb-1 font-semibold print:text-black">
                {home.coach || "( .................................... )"}
              </div>
              <span className="text-[10px] print:text-[7pt] text-muted-foreground print:text-slate-700 mt-1">
                Official Tim {home.teamName}
              </span>
            </div>

            <div className="flex flex-col justify-end h-20 print:h-16">
              <div className="border-b border-black/80 print:border-black pb-1 font-semibold print:text-black">
                {away.coach || "( .................................... )"}
              </div>
              <span className="text-[10px] print:text-[7pt] text-muted-foreground print:text-slate-700 mt-1">
                Official Tim {away.teamName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintBoxScoreTable({ team, label }: { team: TeamBoxScore; label: string }) {
  return (
    <div className="flex flex-col gap-1 print:gap-0.5 print:break-inside-avoid min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <span className="font-bold uppercase tracking-wider print:text-[8pt] print:text-black truncate">
          Box Score: {team.teamName} ({label})
        </span>
        <div className="font-mono text-[11px] print:text-[7.5pt] flex items-center gap-3 print:text-black shrink-0">
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

      <div className="overflow-x-auto print:overflow-visible min-w-0 w-full">
        <table className="w-full min-w-[650px] print:min-w-0 text-[10px] print:text-[7pt] text-right border-collapse border border-border print:border-slate-800">
          <thead className="bg-muted/70 print:bg-slate-100 text-muted-foreground print:text-black font-semibold uppercase text-[9px] print:text-[6.5pt] border-b border-border print:border-slate-800">
            <tr>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 text-center w-6 print:w-5 border border-border print:border-slate-600">
                No
              </th>
              <th className="py-1 px-2 print:py-0.5 print:px-1.5 text-left min-w-[120px] print:min-w-0 border border-border print:border-slate-600">
                Pemain
              </th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 text-center w-6 print:w-4 border border-border print:border-slate-600">
                L/P
              </th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">SM</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">SA</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">%FGS</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">RIM</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">RIA</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">%FGR</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">PM</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">PA</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">%P</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">DR</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">OR</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 font-bold border border-border print:border-slate-600">
                TOT
              </th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">D</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">AS</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">IT</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">TOV</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">F</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">YC</th>
              <th className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">RC</th>
              <th className="py-1 px-1.5 print:py-0.5 print:px-1 font-bold border border-border print:border-slate-600">
                PTS
              </th>
              <th className="py-1 px-1.5 print:py-0.5 print:px-1 font-bold border border-border print:border-slate-600">
                EFF
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border print:divide-slate-300 font-mono text-[10px] print:text-[7pt]">
            {team.players.map((p) => (
              <tr key={p.id}>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 text-center font-bold border border-border print:border-slate-600 print:text-black">
                  #{p.jerseyNumber}
                </td>
                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-left font-sans font-medium truncate max-w-[140px] print:max-w-none print:whitespace-nowrap border border-border print:border-slate-600 print:text-black">
                  {p.athleteName}
                  {p.isStarter && <span className="text-[8px] text-muted-foreground ml-0.5">*</span>}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 text-center font-bold border border-border print:border-slate-600 print:text-black">
                  {p.sexLabel}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.sm}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.sa}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.pctFgsFormatted}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.rim}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.ria}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.pctFgrFormatted}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.pm}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.pa}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.pctPFormatted}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.dr}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.or}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 font-bold border border-border print:border-slate-600 print:text-black">
                  {p.tot}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.d}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.as}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.it}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.tov}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.f}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.yc}
                </td>
                <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600 print:text-black">
                  {p.rc}
                </td>
                <td className="py-1 px-1.5 print:py-0.5 print:px-1 font-bold text-xs print:text-[7.5pt] border border-border print:border-slate-600 print:text-black">
                  {p.pts}
                </td>
                <td className="py-1 px-1.5 print:py-0.5 print:px-1 font-bold text-xs print:text-[7.5pt] border border-border print:border-slate-600 print:text-black">
                  {p.eff}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/80 print:bg-slate-100 font-mono font-bold text-[10px] print:text-[7pt] border-t-2 border-border print:border-slate-800 print:text-black">
            <tr>
              <td
                colSpan={2}
                className="py-1 px-2 print:py-0.5 print:px-1.5 text-left font-sans uppercase border border-border print:border-slate-600"
              >
                Total Tim
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 text-center border border-border print:border-slate-600">
                -
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.sm}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.sa}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.pctFgsFormatted}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.rim}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.ria}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.pctFgrFormatted}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.pm}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.pa}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.pctPFormatted}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.dr}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.or}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.tot}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.d}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.as}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.it}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.tov}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.f}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.yc}
              </td>
              <td className="py-1 px-1 print:py-0.5 print:px-0.5 border border-border print:border-slate-600">
                {team.rc}
              </td>
              <td className="py-1 px-1.5 print:py-0.5 print:px-1 text-xs print:text-[7.5pt] border border-border print:border-slate-600">
                {team.pts}
              </td>
              <td className="py-1 px-1.5 print:py-0.5 print:px-1 text-xs print:text-[7.5pt] border border-border print:border-slate-600">
                {team.eff}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
