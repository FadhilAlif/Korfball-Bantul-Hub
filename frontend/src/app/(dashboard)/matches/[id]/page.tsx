import { MatchDetailPage } from "@/features/matches/components/MatchDetailPage";
import { ProtectedRoute } from "@/shared/components/guard";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return (
    <ProtectedRoute requiredPermission="matches:read">
      <MatchDetailPage matchId={matchId} />
    </ProtectedRoute>
  );
}
