import { AthletesPage } from "@/features/athletes";
import { ProtectedRoute } from "@/shared/components/guard";

export default function AthletesRoutePage() {
  return (
    <ProtectedRoute requiredPermission="athletes:read">
      <AthletesPage />
    </ProtectedRoute>
  );
}
