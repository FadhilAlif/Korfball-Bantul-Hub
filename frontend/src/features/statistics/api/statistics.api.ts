import { apiClient } from "@/shared/lib/api-client";
import type {
  DashboardSummary,
  PlayerLeaderboardItem,
  PlayerLeaderboardQuery,
  PlayerProfileStats,
  TeamStatsQuery,
  TeamStatsSummary,
} from "../types";

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getPlayerLeaderboard(
  query: PlayerLeaderboardQuery = {},
): Promise<PaginatedResponse<PlayerLeaderboardItem>> {
  const response = await apiClient.get<PaginatedResponse<PlayerLeaderboardItem>>("/api/stats/players", {
    params: query,
  });
  return response.data;
}

export async function exportPlayerLeaderboard(query: PlayerLeaderboardQuery = {}): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/stats/players/export", {
    params: query,
    responseType: "blob",
  });
  return response.data;
}

export async function getPlayerProfile(athleteId: number): Promise<PlayerProfileStats> {
  const response = await apiClient.get<{ data: PlayerProfileStats }>(`/api/stats/players/${athleteId}`);
  return response.data.data;
}

export async function getMyStats(): Promise<PlayerProfileStats> {
  const response = await apiClient.get<{ data: PlayerProfileStats }>("/api/stats/me");
  return response.data.data;
}

export async function getTeamStats(query: TeamStatsQuery = {}): Promise<TeamStatsSummary> {
  const response = await apiClient.get<{ data: TeamStatsSummary }>("/api/stats/team", {
    params: query,
  });
  return response.data.data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<{ data: DashboardSummary }>("/api/dashboard/summary");
  return response.data.data;
}
