"use client";

import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthStatusCard } from "@/features/auth/components/AuthStatusCard";
import { BackToSignInLink } from "@/features/auth/components/BackToSignInLink";
import { Button } from "@/shared/components/ui";
import { apiClient } from "@/shared/lib/api-client";
import { getErrorMessage } from "@/shared/lib/api-error";

export function VerifyEmailSent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [cooldown, setCooldown] = useState(0);

  const {
    mutate: resend,
    isPending,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: () => apiClient.post("/auth/resend-verification", { email }),
    onSuccess: () => setCooldown(60),
  });

  // Tick the cooldown down every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const canResend = email !== "" && !isPending && cooldown === 0;

  return (
    <AuthShell footer={<BackToSignInLink />}>
      <AuthStatusCard
        variant="success"
        icon={<Check size={16} />}
        title="Periksa Kotak Masuk Anda"
        description={
          <>
            Kami telah mengirimkan tautan verifikasi ke{" "}
            <b className="text-foreground font-semibold">{email || "email Anda"}</b>. Tautan ini berlaku selama 24 jam.
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => resend()} disabled={!canResend} isLoading={isPending}>
            {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim ulang email verifikasi"}
          </Button>

          {isSuccess && cooldown > 0 && (
            <p className="text-xs text-success text-center">Email terkirim! Silakan periksa kotak masuk Anda.</p>
          )}

          {error && <p className="text-xs text-destructive text-center">{getErrorMessage(error)}</p>}
        </div>
      </AuthStatusCard>
    </AuthShell>
  );
}
