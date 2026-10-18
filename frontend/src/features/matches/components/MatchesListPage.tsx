"use client";

import { Calendar, FileSpreadsheet, Filter, Loader2, MapPin, Play, Plus, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/components/common";
import { Badge } from "@/shared/components/ui/badge";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useMatches } from "../hooks/useMatches";
import type { MatchItem } from "../types";

export function MatchesListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useMatches({
    page,
    limit: 20,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    type: typeFilter === "ALL" ? undefined : typeFilter,
  });

  const matches = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title="Pertandingan & Live Stat"
        description="Jadwal, pencatatan statistik langsung pertandingan Korfball Bantul, box score & laporan resmi."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/matches/new" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Plus size={15} />
            <span>Buat Pertandingan</span>
          </Link>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Filter size={14} />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="LIVE">Live Sekarang</SelectItem>
              <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
              <SelectItem value="FINISHED">Selesai</SelectItem>
              <SelectItem value="PAUSED">Jeda / Paused</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[150px]">
              <SelectValue placeholder="Tipe Match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="OFFICIAL">Official Tournament</SelectItem>
              <SelectItem value="FRIENDLY">Friendly Match</SelectItem>
              <SelectItem value="SCRIMMAGE">Internal Scrimmage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {meta && (
          <span className="text-xs text-muted-foreground">
            Total <strong>{meta.total}</strong> pertandingan
          </span>
        )}
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Memuat data pertandingan...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-sm text-destructive font-medium mb-3">Gagal memuat daftar pertandingan.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </Button>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40">
          <Trophy size={36} className="mx-auto text-muted-foreground/60 mb-3" />
          <h4 className="font-semibold text-base text-foreground mb-1">Belum ada pertandingan</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Mulai buat pertandingan baru (scrimmage atau resmi) untuk menyusun lineup dan mencatat statistik live.
          </p>
          <Link href="/matches/new" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Plus size={14} />
            <span>Buat Pertandingan Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && Math.ceil(meta.total / meta.limit) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs"
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-muted-foreground">
            Halaman {page} dari {Math.ceil(meta.total / meta.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(meta.total / meta.limit)}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs"
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MatchItem }) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-border/80 transition-all gap-4">
      {/* Card Header: Competition, Type, Status */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 truncate text-muted-foreground">
          <span className="font-semibold text-foreground truncate">{match.competition || "Pertandingan Korfball"}</span>
          {match.gameNumber && <span>• {match.gameNumber}</span>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {match.format} ({match.type})
          </Badge>

          {isLive && (
            <Badge
              variant="default"
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] py-0 px-1.5 animate-pulse gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              <span>LIVE B{match.currentPeriod}</span>
            </Badge>
          )}

          {isFinished && (
            <Badge
              variant="outline"
              className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px] py-0 px-1.5"
            >
              SELESAI
            </Badge>
          )}

          {isScheduled && (
            <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-1.5">
              JADWAL
            </Badge>
          )}
        </div>
      </div>

      {/* Main Score & Teams row */}
      <div className="flex items-center justify-between gap-2 py-2 border-y border-border/50">
        {/* Home side */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
          <div className="truncate">
            <div className="font-bold text-sm text-foreground truncate flex items-center justify-end gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match.homeColor || "#FACC15" }}
              />
              <span className="truncate">{match.homeTeamName}</span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">HOME</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center font-black text-xl text-foreground tabular-nums">
            {match.homeScore}
          </div>
        </div>

        <div className="text-xs font-bold text-muted-foreground px-1 shrink-0">VS</div>

        {/* Away side */}
        <div className="flex-1 min-w-0 flex items-center justify-start gap-2 text-left">
          <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center font-black text-xl text-foreground tabular-nums">
            {match.awayScore}
          </div>
          <div className="truncate">
            <div className="font-bold text-sm text-foreground truncate flex items-center justify-start gap-1.5">
              <span className="truncate">{match.awayTeamName}</span>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match.awayColor || "#3B82F6" }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">AWAY</span>
          </div>
        </div>
      </div>

      {/* Metadata info: Venue & Date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1 truncate">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{match.venue || "Lapangan Korfball"}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Calendar size={13} />
          <span>{formatDate(match.scheduledAt)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Link href={`/matches/${match.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Detail & Lineup
        </Link>

        {isLive && (
          <Link
            href={`/matches/${match.id}/record`}
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "bg-red-600 hover:bg-red-700 text-white gap-1",
            })}
          >
            <Play size={11} fill="currentColor" />
            <span>Live Recorder</span>
          </Link>
        )}

        {isScheduled && (
          <Link
            href={`/matches/${match.id}/record`}
            className={buttonVariants({ variant: "default", size: "sm", className: "gap-1" })}
          >
            <Play size={11} />
            <span>Mulai Rekam</span>
          </Link>
        )}

        <Link href={`/matches/${match.id}/box-score`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Box Score
        </Link>

        {isFinished && (
          <Link
            href={`/matches/${match.id}/report`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1 text-xs" })}
          >
            <FileSpreadsheet size={12} />
            <span>Laporan</span>
          </Link>
        )}
      </div>
    </div>
  );
}
