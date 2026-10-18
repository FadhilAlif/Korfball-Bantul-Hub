import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types";
import type {
  BatchEventsResponse,
  BoxScoreData,
  LineupPlayerItemInput,
  MatchDetail,
  MatchItem,
  MatchSide,
} from "../types";

export interface ListMatchesParams {
  page?: number;
  limit?: number;
  teamId?: number;
  type?: string;
  format?: string;
  status?: string;
  from?: string;
  to?: string;
}

export const matchesApi = {
  async list(params: ListMatchesParams = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.teamId) query.set("teamId", String(params.teamId));
    if (params.type) query.set("type", params.type);
    if (params.format) query.set("format", params.format);
    if (params.status) query.set("status", params.status);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const res = await apiClient.get<PaginatedResponse<MatchItem>>(`/matches?${query.toString()}`);
    return res.data;
  },

  async get(id: number) {
    const res = await apiClient.get<{ data: MatchDetail }>(`/matches/${id}`);
    return res.data.data;
  },

  async create(payload: Record<string, unknown>) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>("/matches", payload);
    return res.data;
  },

  async update(id: number, payload: Record<string, unknown>) {
    const res = await apiClient.patch<{ data: MatchDetail; message: string }>(`/matches/${id}`, payload);
    return res.data;
  },

  async delete(id: number) {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/matches/${id}`);
    return res.data;
  },

  async setLineup(id: number, payload: { side: MatchSide; players: LineupPlayerItemInput[] }) {
    const res = await apiClient.put<{ data: MatchDetail; message: string }>(`/matches/${id}/lineup`, payload);
    return res.data;
  },

  async start(id: number, force = false) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>(`/matches/${id}/start`, { force });
    return res.data;
  },

  async startPeriod(id: number, period: number) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>(`/matches/${id}/periods/${period}/start`);
    return res.data;
  },

  async endPeriod(id: number, period: number) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>(`/matches/${id}/periods/${period}/end`);
    return res.data;
  },

  async patchClock(
    id: number,
    payload: { currentPeriod?: number; clockRemainingSeconds?: number; clockRunningSince?: string | null },
  ) {
    const res = await apiClient.patch<{ data: MatchDetail }>(`/matches/${id}/clock`, payload);
    return res.data;
  },

  async finish(id: number) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>(`/matches/${id}/finish`);
    return res.data;
  },

  async reopen(id: number) {
    const res = await apiClient.post<{ data: MatchDetail; message: string }>(`/matches/${id}/reopen`);
    return res.data;
  },

  async batchEvents(id: number, events: unknown[]) {
    const res = await apiClient.post<{ data: BatchEventsResponse; message: string }>(`/matches/${id}/events/batch`, {
      events,
    });
    return res.data.data;
  },

  async updateEvent(id: number, eventId: string, payload: Record<string, unknown>) {
    const res = await apiClient.patch<{ data: unknown; message: string }>(`/matches/${id}/events/${eventId}`, payload);
    return res.data;
  },

  async deleteEvent(id: number, eventId: string) {
    const res = await apiClient.delete<{ data: unknown; message: string }>(`/matches/${id}/events/${eventId}`);
    return res.data;
  },

  async listEvents(id: number, afterSeq?: number) {
    const query = afterSeq ? `?afterSeq=${afterSeq}` : "";
    const res = await apiClient.get<{ data: unknown[] }>(`/matches/${id}/events${query}`);
    return res.data.data;
  },

  async getBoxScore(id: number) {
    const res = await apiClient.get<{ data: BoxScoreData }>(`/matches/${id}/box-score`);
    return res.data.data;
  },

  async exportReport(id: number): Promise<Blob> {
    const res = await apiClient.get(`/matches/${id}/report/export`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
