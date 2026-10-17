"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types";
import type { TeamFormOutput } from "../schemas/team.schema";
import type { TeamItem } from "../types";

export interface UseTeamsParams {
  page?: number;
  limit?: number;
  search?: string;
  isInternal?: string;
}

export function useTeams({ page = 1, limit = 20, search = "", isInternal = "" }: UseTeamsParams = {}) {
  return useQuery<PaginatedResponse<TeamItem>>({
    queryKey: ["teams", page, limit, search, isInternal],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (isInternal) params.set("isInternal", isInternal);
      const res = await apiClient.get(`/teams?${params.toString()}`);
      return res.data;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TeamFormOutput) => {
      const res = await apiClient.post("/teams", payload);
      return res.data.data as TeamItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<TeamFormOutput> }) => {
      const res = await apiClient.patch(`/teams/${id}`, payload);
      return res.data.data as TeamItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
