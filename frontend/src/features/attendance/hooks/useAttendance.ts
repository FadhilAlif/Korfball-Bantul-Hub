"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/shared/lib/api-client";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import type {
  AttendanceSheetResponse,
  AttendanceStatus,
  AttendanceSummaryResponse,
  MyAttendanceHistoryResponse,
} from "../types";

export function useAttendanceSheet(sessionId: number, isScheduled = false) {
  return useQuery<AttendanceSheetResponse>({
    queryKey: ["attendance-sheet", sessionId],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${sessionId}/attendance`);
      return res.data.data as AttendanceSheetResponse;
    },
    enabled: Number.isFinite(sessionId) && sessionId > 0,
    refetchInterval: isScheduled ? 10000 : false,
  });
}

export function useBulkSaveAttendance(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (records: Array<{ athleteId: number; status: AttendanceStatus; note?: string | null }>) => {
      const res = await apiClient.put(`/sessions/${sessionId}/attendance`, { records });
      return res.data.data as AttendanceSheetResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance-sheet", sessionId], data);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useFinalizeSession(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/sessions/${sessionId}/finalize`);
      return res.data.data as AttendanceSheetResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance-sheet", sessionId], data);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export interface SelfCheckinResponse {
  sessionId?: number;
  sessionTitle: string;
  athleteId?: number;
  athleteName?: string;
  status: AttendanceStatus;
  checkedInAt: string;
  distanceMeters?: number | null;
  alreadyCheckedIn?: boolean;
  message: string;
}

export type SelfCheckinPayload = string | { code: string } | { sessionId: number; latitude: number; longitude: number };

export function useSelfCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SelfCheckinPayload) => {
      const payload = typeof input === "string" ? { code: input } : input;
      const res = await apiClient.post("/attendance/check-in", payload);
      return res.data.data as SelfCheckinResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSubmitExcuse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: number; reason: string }) => {
      const res = await apiClient.post(`/sessions/${sessionId}/excuse`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCancelExcuse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      await apiClient.delete(`/sessions/${sessionId}/excuse`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useMyAttendanceHistory(params: { from?: string; to?: string } = {}) {
  return useQuery<MyAttendanceHistoryResponse>({
    queryKey: ["my-attendance", params.from ?? "", params.to ?? ""],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.from) search.set("from", `${params.from}T00:00:00+07:00`);
      if (params.to) search.set("to", `${params.to}T23:59:59+07:00`);
      const qs = search.toString();
      const res = await apiClient.get(`/attendance/me${qs ? `?${qs}` : ""}`);
      return res.data.data as MyAttendanceHistoryResponse;
    },
  });
}

export interface AttendanceSummaryParams {
  from: string;
  to: string;
  type?: string;
  status?: string;
}

export function useAttendanceSummary(params: AttendanceSummaryParams) {
  return useQuery<AttendanceSummaryResponse>({
    queryKey: ["attendance-summary", params.from, params.to, params.type ?? "", params.status ?? ""],
    queryFn: async () => {
      const search = new URLSearchParams({
        from: params.from,
        to: params.to,
      });
      if (params.type) search.set("type", params.type);
      if (params.status) search.set("status", params.status);
      const res = await apiClient.get(`/attendance/summary?${search.toString()}`);
      return res.data.data as AttendanceSummaryResponse;
    },
    enabled: Boolean(params.from && params.to),
  });
}

export function useExportAttendanceSummary() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (params: AttendanceSummaryParams) => {
      const queryParams: Record<string, string> = {
        from: params.from,
        to: params.to,
      };
      if (params.type) queryParams.type = params.type;
      if (params.status) queryParams.status = params.status;

      const res = await apiClient.get<Blob>("/attendance/summary/export", {
        responseType: "blob",
        params: queryParams,
      });
      const url = URL.createObjectURL(res.data);
      const dateStr = new Date().toISOString().slice(0, 10);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `presensi-korfball-bantul-${dateStr}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (err) => toast.error("Gagal mengunduh laporan XLSX", { description: getErrorMessage(err) }),
  });

  const exportSummary = useCallback((params: AttendanceSummaryParams) => mutate(params), [mutate]);
  return { exportSummary, isExporting: isPending };
}
