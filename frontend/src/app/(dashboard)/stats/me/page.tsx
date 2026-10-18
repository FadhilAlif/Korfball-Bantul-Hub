"use client";

import { Loader2, UserX } from "lucide-react";
import Link from "next/link";
import { PlayerProfilePage, useMyStats } from "@/features/statistics";
import { ProtectedRoute } from "@/shared/components/guard";
import { Button } from "@/shared/components/ui/button";

export default function Page() {
  const { data, isLoading, error } = useMyStats();

  return (
    <ProtectedRoute requiredPermission="stats:read_own">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="text-sm">Memuat profil statistik Anda...</span>
        </div>
      ) : error || !data ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl text-muted-foreground bg-card gap-3">
          <UserX size={36} className="text-muted-foreground/60" />
          <div className="font-semibold text-base text-foreground">Akun Belum Ditautkan ke Profil Atlet</div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Statistik pribadi hanya tersedia jika akun pengguna Anda telah ditautkan oleh Official/Pelatih ke salah satu
            profil atlet tim internal.
          </p>
          <Link href="/dashboard" className="mt-2">
            <Button size="sm" variant="outline">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      ) : (
        <PlayerProfilePage data={data} backHref="/dashboard" isSelf />
      )}
    </ProtectedRoute>
  );
}
