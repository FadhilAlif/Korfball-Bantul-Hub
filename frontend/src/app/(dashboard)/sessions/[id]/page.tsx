import { use } from "react";
import { AttendanceSheetPage } from "@/features/attendance";

export default function SessionDetailRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AttendanceSheetPage sessionId={Number(id)} />;
}
