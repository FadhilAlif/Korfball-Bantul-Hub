import { use } from "react";
import { AttendanceSheetPage } from "@/features/attendance";
import { ProtectedRoute } from "@/shared/components/guard";

export default function SessionDetailRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermission="attendance:read">
      <AttendanceSheetPage sessionId={Number(id)} />
    </ProtectedRoute>
  );
}
