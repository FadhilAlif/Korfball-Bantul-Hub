import { LiveRecorderPage } from "@/features/live-recorder/LiveRecorderPage";
import { ProtectedRoute } from "@/shared/components/guard";

interface RecordPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return (
    <ProtectedRoute requiredPermission="matches:record">
      <LiveRecorderPage matchId={matchId} />
    </ProtectedRoute>
  );
}
