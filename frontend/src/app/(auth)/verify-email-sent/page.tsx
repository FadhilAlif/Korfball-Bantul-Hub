import { Suspense } from "react";
import { VerifyEmailSent } from "@/features/auth/verify-email-sent";

export const metadata = { title: "Email Verifikasi Terkirim — Korfball Hub" };

export default function VerifyEmailSentPage() {
  return (
    <Suspense>
      <VerifyEmailSent />
    </Suspense>
  );
}
