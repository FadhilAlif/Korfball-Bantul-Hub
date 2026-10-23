"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Alert, Button, FormField, Input, PasswordStrengthMeter } from "@/shared/components/ui";
import { useRegisterForm } from "./useRegisterForm";

// Memoised at module level — avoids re-creating the wrapped component on every render
const PasswordStrengthMeterMemo = memo(PasswordStrengthMeter);

const footer = (
  <>
    Sudah memiliki akun?{" "}
    <Link href="/login" className="text-primary font-medium no-underline">
      Masuk
    </Link>
  </>
);

export function RegisterForm() {
  const { form, isPending, password, onSubmit } = useRegisterForm();

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <AuthShell footer={footer}>
      <h1 className="text-[26px] font-semibold tracking-tight m-0">Buat Akun Baru</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted-foreground">
        Daftarkan akun Anda untuk mengakses portal Korfball Hub Bantul.
      </p>

      {errors.root?.message && <Alert message={errors.root.message} className="mb-4" />}

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField label="Nama Lengkap" required error={errors.name?.message}>
          <Input
            type="text"
            placeholder="Nama Lengkap Anda"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
        </FormField>

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
          required
          error={errors.password?.message}
          hint={!errors.password?.message ? "Minimal 8 karakter, kombinasi huruf dan angka" : undefined}
        >
          <Input
            type="password"
            placeholder="Buat password yang kuat"
            autoComplete="new-password"
            iconLeft={<Lock size={16} />}
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrengthMeterMemo password={password} />
        </FormField>

        <FormField label="Konfirmasi Password" required error={errors.confirmPassword?.message}>
          <Input
            type="password"
            placeholder="Ulangi password"
            autoComplete="new-password"
            iconLeft={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" isLoading={isPending} fullWidth size="lg" className="mt-1.5">
          Daftar Akun
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-1">
          Dengan mendaftar, Anda menyetujui Ketentuan &amp; Kebijakan Privasi Korfball Hub.
        </p>
      </form>
    </AuthShell>
  );
}
