"use client";

import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/shared/components/common";
import { Button, buttonVariants } from "@/shared/components/ui";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col items-center text-center gap-4">
        <BrandMark />

        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mt-2">
          <ShieldAlert size={30} strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 mb-1">
            403 Forbidden
          </div>
          <h1 className="text-xl font-bold tracking-tight">Akses Tidak Diizinkan</h1>
          <p className="text-sm text-muted-foreground">
            Akun Anda tidak memiliki hak akses (permission) yang cukup untuk membuka halaman ini. Hubungi administrator
            jika Anda membutuhkan akses tambahan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
          <Button type="button" variant="outline" fullWidth onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft size={15} />
            <span>Halaman Sebelumnya</span>
          </Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "primary", fullWidth: true, className: "gap-1.5" })}
          >
            <Home size={15} />
            <span>Ke Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
