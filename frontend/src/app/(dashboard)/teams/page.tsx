import { TeamsPage } from "@/features/teams";
import { ProtectedRoute } from "@/shared/components/guard";

export default function TeamsRoutePage() {
  return (
    <ProtectedRoute requiredPermission="teams:read">
      <TeamsPage />
    </ProtectedRoute>
  );
}
