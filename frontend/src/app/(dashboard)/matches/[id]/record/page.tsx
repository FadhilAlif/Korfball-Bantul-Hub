import { LiveRecorderPage } from "@/features/live-recorder/LiveRecorderPage";

interface RecordPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return <LiveRecorderPage matchId={matchId} />;
}
