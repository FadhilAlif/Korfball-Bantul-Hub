"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useEffect } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthStatusCard } from "@/features/auth/components/AuthStatusCard";
import { BackToSignInLink } from "@/features/auth/components/BackToSignInLink";
import { Button, Spinner } from "@/shared/components/ui";
import { apiClient } from "@/shared/lib/api-client";
import { getErrorMessage } from "@/shared/lib/api-error";
import { type AuthenticatedUser, authenticatedUserSchema } from "@/shared/types";

const LoadingState = memo(function LoadingState() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-4 py-8">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Memverifikasi email Anda…</p>
      </div>
    </AuthShell>
  );
});

const NoTokenState = memo(function NoTokenState() {
  return (
    <AuthShell footer={<BackToSignInLink />}>
      <AuthStatusCard
        variant="destructive"
        icon={<AlertCircle size={16} />}
        title="Tautan Tidak Valid"
        description="Tautan verifikasi ini tidak memiliki token. Silakan gunakan tautan dari email resmi Anda."
      >
        <Button variant="outline" asChild>
          <Link href="/login">Kembali ke halaman masuk</Link>
        </Button>
      </AuthStatusCard>
    </AuthShell>
  );
});

interface ErrorStateProps {
  error: Error;
}

const ErrorState = memo(function ErrorState({ error }: ErrorStateProps) {
  return (
    <AuthShell footer={<BackToSignInLink />}>
      <AuthStatusCard
        variant="destructive"
        icon={<AlertCircle size={16} />}
        title="Verifikasi Gagal"
        description={getErrorMessage(error)}
      >
        <Button variant="outline" asChild>
          <Link href="/login">Kembali ke halaman masuk</Link>
        </Button>
      </AuthStatusCard>
    </AuthShell>
  );
});

const SuccessState = memo(function SuccessState() {
  return (
    <AuthShell>
      <AuthStatusCard
        variant="success"
        icon={<Check size={16} />}
        title="Email Berhasil Diverifikasi!"
        description="Mengalihkan Anda ke Dashboard…"
      />
    </AuthShell>
  );
});

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const token = searchParams.get("token");

  const { mutate, isPending, isSuccess, isError, error } = useMutation<AuthenticatedUser, Error, string>({
    mutationFn: async (t) => {
      const response = await apiClient.post("/auth/verify-email", { token: t });
      return authenticatedUserSchema.parse(response.data.data);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      router.push("/dashboard");
    },
  });

  useEffect(() => {
    if (token) mutate(token);
  }, [token, mutate]);

  if (!token) return <NoTokenState />;
  if (isPending) return <LoadingState />;
  if (isError && error) return <ErrorState error={error} />;
  if (isSuccess) return <SuccessState />;

  return null;
}
