import { useMutation, useQuery } from "@tanstack/react-query";
import {
  exportPlayerLeaderboard,
  getDashboardSummary,
  getMyStats,
  getPlayerLeaderboard,
  getPlayerProfile,
  getTeamStats,
} from "../api/statistics.api";
import type { PlayerLeaderboardQuery, TeamStatsQuery } from "../types";

export const STATS_KEYS = {
  all: ["statistics"] as const,
  leaderboard: (query: PlayerLeaderboardQuery) => [...STATS_KEYS.all, "leaderboard", query] as const,
  playerProfile: (athleteId: number) => [...STATS_KEYS.all, "player", athleteId] as const,
  myStats: () => [...STATS_KEYS.all, "me"] as const,
  team: (query: TeamStatsQuery) => [...STATS_KEYS.all, "team", query] as const,
  dashboard: () => ["dashboard", "summary"] as const,
};

export function usePlayerLeaderboard(query: PlayerLeaderboardQuery = {}) {
  return useQuery({
    queryKey: STATS_KEYS.leaderboard(query),
    queryFn: () => getPlayerLeaderboard(query),
    staleTime: 60 * 1000,
  });
}

export function useExportPlayerLeaderboard() {
  return useMutation({
    mutationFn: (query: PlayerLeaderboardQuery) => exportPlayerLeaderboard(query),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `statistik-pemain-korfball-bantul-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function usePlayerProfile(athleteId: number, enabled = true) {
  return useQuery({
    queryKey: STATS_KEYS.playerProfile(athleteId),
    queryFn: () => getPlayerProfile(athleteId),
    enabled: enabled && !Number.isNaN(athleteId) && athleteId > 0,
    staleTime: 60 * 1000,
  });
}

export function useMyStats(enabled = true) {
  return useQuery({
    queryKey: STATS_KEYS.myStats(),
    queryFn: () => getMyStats(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useTeamStats(query: TeamStatsQuery = {}) {
  return useQuery({
    queryKey: STATS_KEYS.team(query),
    queryFn: () => getTeamStats(query),
    staleTime: 60 * 1000,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: STATS_KEYS.dashboard(),
    queryFn: () => getDashboardSummary(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // keep live score and sessions fresh
  });
}
