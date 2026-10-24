import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth/verify-email";

export const metadata = { title: "Verifikasi Email — Korfball Hub" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
