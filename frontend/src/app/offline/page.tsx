"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/shared/components/common";
import { Button, buttonVariants } from "@/shared/components/ui";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center gap-4">
        <BrandMark />

        <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mt-2">
          <WifiOff size={24} strokeWidth={1.5} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight">Anda Sedang Offline</h1>
          <p className="text-sm text-muted-foreground">
            Koneksi internet tidak tersedia saat ini. Periksa jaringan perangkat Anda lalu muat ulang halaman.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={() => window.location.reload()}>
            <RefreshCw size={15} />
            Coba Lagi
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "primary", fullWidth: true })}>
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
