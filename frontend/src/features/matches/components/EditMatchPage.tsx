"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/common";
import { buttonVariants } from "@/shared/components/ui/button";
import { useMatch } from "../hooks/useMatches";
import { MatchForm } from "./MatchForm";

interface EditMatchPageProps {
  matchId: number;
}

export function EditMatchPage({ matchId }: EditMatchPageProps) {
  const { data: match, isLoading, isError } = useMatch(matchId);

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
        <p className="text-sm text-destructive font-semibold">Gagal memuat pertandingan.</p>
        <Link href={`/matches/${matchId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/matches/${matchId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail Pertandingan</span>
        </Link>
      </div>

      <PageHeader
        title="Edit Pertandingan"
        description={`Perbarui informasi pertandingan ${match.homeTeamName} vs ${match.awayTeamName}.`}
      />

      <MatchForm initialData={match} isEdit />
    </div>
  );
}
