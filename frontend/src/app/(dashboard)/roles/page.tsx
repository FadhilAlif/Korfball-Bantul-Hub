import { RolesPage } from "@/features/roles";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="roles:read">
      <RolesPage />
    </ProtectedRoute>
  );
}
