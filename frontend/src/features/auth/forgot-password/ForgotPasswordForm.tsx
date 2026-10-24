"use client";

import { Check, Mail } from "lucide-react";
import { memo } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthStatusCard } from "@/features/auth/components/AuthStatusCard";
import { BackToSignInLink } from "@/features/auth/components/BackToSignInLink";
import { Button, FormField, Input } from "@/shared/components/ui";
import { useForgotPasswordForm } from "./useForgotPasswordForm";

interface SuccessStateProps {
  email: string;
  onRetry: () => void;
}

const SuccessState = memo(function SuccessState({ email, onRetry }: SuccessStateProps) {
  return (
    <AuthStatusCard
      variant="success"
      icon={<Check size={16} />}
      title="Periksa Kotak Masuk Anda"
      description={
        <>
          Kami telah mengirimkan tautan atur ulang password ke <b className="text-foreground font-semibold">{email}</b>.
          Tautan berlaku selama 30 menit.
        </>
      }
    >
      <Button type="button" variant="outline" onClick={onRetry}>
        Gunakan email lain
      </Button>
    </AuthStatusCard>
  );
});

export function ForgotPasswordForm() {
  const { form, isLoading, success, submittedEmail, onRetry, onSubmit } = useForgotPasswordForm();

  const {
    register,
    formState: { errors },
  } = form;

  if (success) {
    return (
      <AuthShell footer={<BackToSignInLink />}>
        <SuccessState email={submittedEmail} onRetry={onRetry} />
      </AuthShell>
    );
  }

  return (
    <AuthShell footer={<BackToSignInLink />}>
      <h1 className="text-[26px] font-semibold tracking-tight m-0">Lupa Password?</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted-foreground">
        Masukkan email terdaftar Anda untuk menerima tautan atur ulang password.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="nama@korfballbantul.id"
            autoComplete="email"
            iconLeft={<Mail size={16} />}
            error={errors.email?.message}
            {...register("email")}
          />
        </FormField>

        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
          Kirim Tautan Reset
        </Button>
      </form>
    </AuthShell>
  );
}
