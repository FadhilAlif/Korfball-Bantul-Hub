import { MyAttendancePage } from "@/features/attendance";
import { ProtectedRoute } from "@/shared/components/guard";

export default function MyAttendanceRoutePage() {
  return (
    <ProtectedRoute requiredPermission="attendance:self">
      <MyAttendancePage />
    </ProtectedRoute>
  );
}
