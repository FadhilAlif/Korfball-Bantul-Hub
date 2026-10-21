import { SessionsPage } from "@/features/sessions";
import { ProtectedRoute } from "@/shared/components/guard";

export default function SessionsRoutePage() {
  return (
    <ProtectedRoute requiredPermission="sessions:read">
      <SessionsPage />
    </ProtectedRoute>
  );
}
