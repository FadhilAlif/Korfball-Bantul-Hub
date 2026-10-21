import { AttendanceSummaryPage } from "@/features/attendance";
import { ProtectedRoute } from "@/shared/components/guard";

export default function AttendanceSummaryRoutePage() {
  return (
    <ProtectedRoute requiredPermission="attendance:export">
      <AttendanceSummaryPage />
    </ProtectedRoute>
  );
}
