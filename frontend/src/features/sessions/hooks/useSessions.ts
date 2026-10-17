"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types";
import type { GenerateRoutineFormOutput } from "../schemas/session.schema";
import type { SessionItem, SessionType } from "../types";

export interface UseSessionsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface CreateSessionPayload {
  type: SessionType;
  title: string;
  startsAt: string;
  endsAt: string;
  venue?: string | null;
  lateToleranceMinutes?: number;
  notes?: string | null;
}

export function useSessions({
  page = 1,
  limit = 20,
  type = "",
  status = "",
  from = "",
  to = "",
}: UseSessionsParams = {}) {
  return useQuery<PaginatedResponse<SessionItem>>({
    queryKey: ["sessions", page, limit, type, status, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      if (from) params.set("from", `${from}T00:00:00+07:00`);
      if (to) params.set("to", `${to}T23:59:59+07:00`);
      const res = await apiClient.get(`/sessions?${params.toString()}`);
      return res.data;
    },
  });
}

export function useSession(id: number) {
  return useQuery<SessionItem>({
    queryKey: ["sessions", "detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${id}`);
      return res.data.data as SessionItem;
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSessionPayload) => {
      const res = await apiClient.post("/sessions", payload);
      return res.data.data as SessionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateSessionPayload> }) => {
      const res = await apiClient.patch(`/sessions/${id}`, payload);
      return res.data.data as SessionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useGenerateRoutineSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GenerateRoutineFormOutput) => {
      const res = await apiClient.post("/sessions/generate-routine", payload);
      return res.data as {
        message: string;
        data: { createdCount: number; skippedCount: number; sessions: SessionItem[] };
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/sessions/${id}/cancel`);
      return res.data.data as SessionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useRegenerateCheckinCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/sessions/${id}/checkin-code`);
      return res.data.data as { id: number; checkinCode: string };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sheet", id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
