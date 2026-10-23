import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password";

export const metadata = { title: "Atur Ulang Password — Korfball Hub" };

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
