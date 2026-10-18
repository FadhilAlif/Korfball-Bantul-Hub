import { BoxScorePage } from "@/features/matches/components/BoxScorePage";

interface BoxScoreRouteProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Box Score Pertandingan | Korfball Hub",
};

export default async function BoxScoreRoute({ params }: BoxScoreRouteProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return <BoxScorePage matchId={matchId} />;
}
