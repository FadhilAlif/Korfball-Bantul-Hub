import type { Metadata } from "next";
import { LeaderboardPage } from "@/features/statistics";
import { ProtectedRoute } from "@/shared/components/guard";

export const metadata: Metadata = {
  title: "Statistik Pertandingan — Korfball Hub",
  description: "Leaderboard statistik individu pemain dan rekap agregat tim Korfball Bantul",
};

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="stats:read">
      <LeaderboardPage />
    </ProtectedRoute>
  );
}
