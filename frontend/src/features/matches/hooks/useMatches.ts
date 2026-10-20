"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ListMatchesParams, matchesApi } from "../api/matches.api";
import type { LineupPlayerItemInput, MatchSide } from "../types";

export function useMatches(params: ListMatchesParams = {}) {
  return useQuery({
    queryKey: ["matches", params],
    queryFn: () => matchesApi.list(params),
  });
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: ["matches", "detail", id],
    queryFn: () => matchesApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => matchesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useUpdateMatch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => matchesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", id] });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => matchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useSetLineup(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { side: MatchSide; players: LineupPlayerItemInput[] }) =>
      matchesApi.setLineup(matchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useStartMatch(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (force?: boolean) => matchesApi.start(matchId, force ?? false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useStartPeriod(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (period: number) => matchesApi.startPeriod(matchId, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useEndPeriod(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (period: number) => matchesApi.endPeriod(matchId, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function usePatchClock(matchId: number) {
  return useMutation({
    mutationFn: (payload: {
      currentPeriod?: number;
      clockRemainingSeconds?: number;
      clockRunningSince?: string | null;
    }) => matchesApi.patchClock(matchId, payload),
  });
}

export function useFinishMatch(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => matchesApi.finish(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useReopenMatch(matchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => matchesApi.reopen(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "detail", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useBoxScore(id: number, isLive = false) {
  return useQuery({
    queryKey: ["matches", "box-score", id],
    queryFn: () => matchesApi.getBoxScore(id),
    enabled: Number.isFinite(id) && id > 0,
    refetchInterval: isLive ? 10_000 : false,
  });
}

export function useExportMatchReport(matchId: number) {
  return useMutation({
    mutationFn: async () => {
      const blob = await matchesApi.exportReport(matchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-pertandingan-match-${matchId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}
