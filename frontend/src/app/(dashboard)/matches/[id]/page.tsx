import { MatchDetailPage } from "@/features/matches/components/MatchDetailPage";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return <MatchDetailPage matchId={matchId} />;
}
