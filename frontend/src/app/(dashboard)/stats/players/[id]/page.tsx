"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PlayerProfilePage, usePlayerProfile } from "@/features/statistics";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  const params = useParams();
  const athleteId = Number(params.id);

  const { data, isLoading, error } = usePlayerProfile(athleteId);

  return (
    <ProtectedRoute requiredPermission="stats:read">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="text-sm">Memuat profil statistik pemain...</span>
        </div>
      ) : error || !data ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground bg-card">
          Profil statistik pemain tidak ditemukan atau Anda tidak memiliki izin akses.
        </div>
      ) : (
        <PlayerProfilePage data={data} backHref="/stats" />
      )}
    </ProtectedRoute>
  );
}
