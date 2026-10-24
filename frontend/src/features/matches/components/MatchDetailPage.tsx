"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Play,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/shared/components/common";
import { Badge } from "@/shared/components/ui/badge";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { usePermission } from "@/shared/hooks";
import { formatWibDateTime } from "@/shared/lib/format-date";
import { useDeleteMatch, useMatch, useReopenMatch, useStartMatch } from "../hooks/useMatches";
import { LineupEditor } from "./LineupEditor";

interface MatchDetailPageProps {
  matchId: number;
}

export function MatchDetailPage({ matchId }: MatchDetailPageProps) {
  const router = useRouter();
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);

  const canEditMatch = usePermission("matches:update");
  const canRecord = usePermission("matches:record");
  const canReopen = usePermission("matches:reopen");
  const canDeleteMatch = usePermission("matches:delete");

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const startMatchMutation = useStartMatch(matchId);
  const reopenMatchMutation = useReopenMatch(matchId);
  const deleteMatchMutation = useDeleteMatch();

  const handleDelete = () => {
    deleteMatchMutation.mutate(matchId, {
      onSuccess: () => {
        toast.success("Pertandingan berhasil dihapus.");
        router.push("/matches");
      },
      onError: (err: unknown) => {
        const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error(
          errorResponse?.response?.data?.message || errorResponse?.message || "Gagal menghapus pertandingan.",
        );
        setIsConfirmDeleteOpen(false);
      },
    });
  };

  const handleStart = () => {
    startMatchMutation.mutate(true, {
      onSuccess: () => {
        toast.success("Pertandingan dimulai!");
        router.push(`/matches/${matchId}/record`);
      },
      onError: (err: unknown) => {
        const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error(errorResponse?.response?.data?.message || errorResponse?.message || "Gagal memulai pertandingan.");
      },
    });
  };

  const handleReopen = () => {
    reopenMatchMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Pertandingan dibuka kembali (LIVE).");
        void refetch();
      },
      onError: (err: unknown) => {
        const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error(
          errorResponse?.response?.data?.message || errorResponse?.message || "Gagal membuka kembali pertandingan.",
        );
      },
    });
  };

  const formatDate = (isoString?: string) => (isoString ? formatWibDateTime(isoString) : "-");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat data pertandingan...</span>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-sm text-destructive font-semibold">Pertandingan tidak ditemukan.</p>
        <Link href="/matches" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali ke Daftar Match
        </Link>
      </div>
    );
  }

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";

  return (
    <div className="flex flex-col gap-6">
      {/* Top back navigation & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Pertandingan</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {!isFinished && canEditMatch && (
            <Link
              href={`/matches/${match.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1 text-xs" })}
            >
              <Edit size={12} />
              <span>Edit Match</span>
            </Link>
          )}

          <Link
            href={`/matches/${match.id}/box-score`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Box Score
          </Link>

          <Link
            href={`/matches/${match.id}/report`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1" })}
          >
            <FileSpreadsheet size={13} />
            <span>Laporan Cetak</span>
          </Link>

          {canDeleteMatch && (isScheduled || match.status === "CANCELLED") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <Trash2 size={13} />
              <span>Hapus Match</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Scoreboard & Match Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-6">
        {/* Banner Top */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold uppercase">
              {match.type} • Format {match.format}
            </Badge>
            {match.competition && <span className="font-semibold text-foreground">{match.competition}</span>}
            {match.gameNumber && <span className="text-muted-foreground">• {match.gameNumber}</span>}
          </div>

          <div>
            {isLive && (
              <Badge variant="default" className="bg-red-500 text-white animate-pulse gap-1">
                <span className="w-2 h-2 rounded-full bg-white inline-block" />
                <span>LIVE (Babak {match.currentPeriod})</span>
              </Badge>
            )}
            {isFinished && (
              <Badge
                variant="outline"
                className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              >
                PERTANDINGAN SELESAI
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="text-muted-foreground">
                TERJADWAL
              </Badge>
            )}
          </div>
        </div>

        {/* Big Scoreboard */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-4 px-2 sm:px-8 bg-muted/20 rounded-2xl border border-border/60">
          {/* Home team */}
          <div className="flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-3 text-right">
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-2xl text-foreground flex items-center justify-end gap-1.5 sm:gap-2">
                <span
                  className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: match.homeColor || "#FACC15" }}
                />
                <span className="truncate">{match.homeTeamName}</span>
              </h2>
              <span className="text-[10px] sm:text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                HOME
              </span>
            </div>
            <div className="w-12 sm:w-20 h-12 sm:h-20 shrink-0 rounded-2xl bg-card border border-border flex items-center justify-center font-black text-2xl sm:text-4xl text-foreground tabular-nums shadow-xs">
              {match.homeScore}
            </div>
          </div>

          <div className="font-bold text-muted-foreground text-xs sm:text-sm uppercase px-1 sm:px-2 shrink-0">VS</div>

          {/* Away team */}
          <div className="flex-1 min-w-0 flex items-center justify-start gap-2 sm:gap-3 text-left">
            <div className="w-12 sm:w-20 h-12 sm:h-20 shrink-0 rounded-2xl bg-card border border-border flex items-center justify-center font-black text-2xl sm:text-4xl text-foreground tabular-nums shadow-xs">
              {match.awayScore}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-2xl text-foreground flex items-center justify-start gap-1.5 sm:gap-2">
                <span className="truncate">{match.awayTeamName}</span>
                <span
                  className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: match.awayColor || "#3B82F6" }}
                />
              </h2>
              <span className="text-[10px] sm:text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                AWAY
              </span>
            </div>
          </div>
        </div>

        {/* Action button row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isScheduled && canRecord && (
            <Button onClick={handleStart} className="gap-2 px-6 w-full sm:w-auto">
              <Play size={16} />
              <span className="text-center">Mulai Pertandingan & Buka Live Recorder</span>
            </Button>
          )}

          {isLive && canRecord && (
            <Link
              href={`/matches/${match.id}/record`}
              className={buttonVariants({
                variant: "default",
                size: "default",
                className: "bg-red-600 hover:bg-red-700 text-white gap-2 px-6 shadow-md w-full sm:w-auto",
              })}
            >
              <Play size={16} fill="currentColor" />
              <span>Lanjutkan Live Recorder</span>
            </Link>
          )}

          {isFinished && canReopen && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={reopenMatchMutation.isPending}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              <RotateCcw size={13} />
              <span>Buka Kembali Match (Reopen)</span>
            </Button>
          )}
        </div>

        {/* Match Metadata details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-foreground shrink-0" />
            <span>{formatDate(match.scheduledAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-foreground shrink-0" />
            <span className="truncate">{match.venue || "Lokasi belum ditentukan"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-foreground shrink-0" />
            <span>
              {match.periodCount} Babak × {match.periodDurationMinutes} Menit
            </span>
          </div>
        </div>
      </div>

      {/* Lineup Management Section */}
      <div className="flex flex-col gap-3 min-w-0 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary shrink-0" />
            <span>Susunan Pemain (Lineup)</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Atur starter dan cadangan kedua tim sebelum atau saat pertandingan
          </span>
        </div>

        <LineupEditor match={match} readOnly={!canEditMatch || isFinished} onSaved={() => void refetch()} />
      </div>

      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus pertandingan ${match.homeTeamName} vs ${match.awayTeamName}?`}
        description="Pertandingan yang dihapus tidak dapat dipulihkan. Hanya pertandingan terjadwal atau dibatalkan tanpa event yang dapat dihapus."
        confirmText={`${match.homeTeamName} vs ${match.awayTeamName}`}
        confirmLabel="Hapus Pertandingan"
        isLoading={deleteMatchMutation.isPending}
      />
    </div>
  );
}
