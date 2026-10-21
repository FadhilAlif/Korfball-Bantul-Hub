import { UsersPage } from "@/features/users";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="users:read">
      <UsersPage />
    </ProtectedRoute>
  );
}
