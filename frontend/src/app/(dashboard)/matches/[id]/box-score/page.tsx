import { BoxScorePage } from "@/features/matches/components/BoxScorePage";
import { ProtectedRoute } from "@/shared/components/guard";

interface BoxScoreRouteProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Box Score Pertandingan | Korfball Hub",
};

export default async function BoxScoreRoute({ params }: BoxScoreRouteProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return (
    <ProtectedRoute requiredPermission="matches:read">
      <BoxScorePage matchId={matchId} />
    </ProtectedRoute>
  );
}
