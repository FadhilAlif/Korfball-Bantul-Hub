"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types";
import type { AthleteFormOutput } from "../schemas/athlete.schema";
import type { AthleteItem } from "../types";

export interface UseAthletesParams {
  page?: number;
  limit?: number;
  teamId?: string | number;
  sex?: string;
  status?: string;
  search?: string;
  enabled?: boolean;
}

export function useAthletes({
  page = 1,
  limit = 20,
  teamId = "",
  sex = "",
  status = "",
  search = "",
  enabled = true,
}: UseAthletesParams = {}) {
  return useQuery<PaginatedResponse<AthleteItem>>({
    queryKey: ["athletes", page, limit, String(teamId), sex, status, search],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (teamId) params.set("teamId", String(teamId));
      if (sex) params.set("sex", sex);
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      const res = await apiClient.get(`/athletes?${params.toString()}`);
      return res.data;
    },
  });
}

export function useCreateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AthleteFormOutput) => {
      const res = await apiClient.post("/athletes", payload);
      return res.data.data as AthleteItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<AthleteFormOutput> }) => {
      const res = await apiClient.patch(`/athletes/${id}`, payload);
      return res.data.data as AthleteItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/athletes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useLinkAthleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ athleteId, userId }: { athleteId: number; userId: number }) => {
      const res = await apiClient.put(`/athletes/${athleteId}/user`, { userId });
      return res.data.data as AthleteItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUnlinkAthleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (athleteId: number) => {
      const res = await apiClient.delete(`/athletes/${athleteId}/user`);
      return res.data.data as AthleteItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
