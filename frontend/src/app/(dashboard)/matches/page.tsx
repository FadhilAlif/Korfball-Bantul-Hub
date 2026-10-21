import { MatchesListPage } from "@/features/matches/components/MatchesListPage";
import { ProtectedRoute } from "@/shared/components/guard";

export const metadata = {
  title: "Pertandingan & Live Stat | Korfball Hub",
  description: "Daftar pertandingan, live stat recorder, dan box score Korfball Bantul.",
};

export default function MatchesPage() {
  return (
    <ProtectedRoute requiredPermission="matches:read">
      <MatchesListPage />
    </ProtectedRoute>
  );
}
