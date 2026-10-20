import { BroadcastPage } from "@/features/notifications";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="notifications:create">
      <BroadcastPage />
    </ProtectedRoute>
  );
}
