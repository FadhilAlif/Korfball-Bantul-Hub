"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Alert, Button, FormField, Input } from "@/shared/components/ui";
import { useLoginForm } from "./useLoginForm";

const footer = (
  <>
    Belum memiliki akun?{" "}
    <Link href="/register" className="text-primary font-medium no-underline">
      Daftar di sini
    </Link>
  </>
);

export function LoginForm() {
  const { form, isPending, isUnverified, submittedEmail, showPassword, toggleShowPassword, onSubmit } = useLoginForm();

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <AuthShell footer={footer}>
      <h1 className="text-[26px] font-semibold tracking-tight m-0">Masuk ke Akun</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted-foreground">
        Portal Presensi Kehadiran &amp; Live Game Statistics Korfball Bantul.
      </p>

      {errors.root?.message && <Alert message={errors.root.message} className="mb-2" />}

      {isUnverified && (
        <p className="text-sm text-muted-foreground mb-4">
          <Link
            href={`/verify-email-sent?email=${encodeURIComponent(submittedEmail)}`}
            className="text-primary font-medium no-underline"
          >
            Kirim ulang email verifikasi
          </Link>
        </p>
      )}

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

        <FormField
          label="Password"
          labelRight={
            <Link href="/forgot-password" className="text-[12.5px] text-primary font-medium no-underline">
              Lupa password?
            </Link>
          }
          required
          error={errors.password?.message}
        >
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password Anda"
            autoComplete="current-password"
            iconLeft={<Lock size={16} />}
            iconRight={
              <Button
                type="button"
                variant="ghost"
                size="iconOnly"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
        </FormField>

        <Button type="submit" isLoading={isPending} fullWidth size="lg">
          Masuk
        </Button>
      </form>
    </AuthShell>
  );
}
