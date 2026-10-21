import { MatchReportPage } from "@/features/matches/components/MatchReportPage";
import { ProtectedRoute } from "@/shared/components/guard";

interface ReportRouteProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Laporan Pertandingan Resmi | Korfball Hub",
};

export default async function ReportRoute({ params }: ReportRouteProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return (
    <ProtectedRoute requiredPermission="matches:read">
      <MatchReportPage matchId={matchId} />
    </ProtectedRoute>
  );
}
