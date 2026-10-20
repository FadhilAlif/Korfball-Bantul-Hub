import { get, set } from "idb-keyval";
import { matchesApi } from "../../matches/api/matches.api";
import type { BatchEventItem, BatchEventsResponse, OutboxSyncStatus } from "../../matches/types";

export interface OutboxRecord {
  id: string; // Event UUID
  matchId: number;
  payload: BatchEventItem;
  createdAt: number;
  retryCount: number;
}

export type OutboxStatusCallback = (status: OutboxSyncStatus, pendingCount: number) => void;
export type OutboxScoreSyncCallback = (homeScore: number, awayScore: number) => void;

export class LiveRecorderOutbox {
  private matchId: number;
  private queueKey: string;
  private inMemoryQueue: OutboxRecord[] = [];
  private isFlushing = false;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<OutboxStatusCallback> = new Set();
  private scoreListeners: Set<OutboxScoreSyncCallback> = new Set();
  private isOnline = true;
  private isIndexedDbAvailable = true;

  constructor(matchId: number) {
    this.matchId = matchId;
    this.queueKey = `korfball_outbox_match_${matchId}`;

    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  public subscribe(cb: OutboxStatusCallback): () => void {
    this.listeners.add(cb);
    cb(this.getStatus(), this.inMemoryQueue.length);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public subscribeScoreSync(cb: OutboxScoreSyncCallback): () => void {
    this.scoreListeners.add(cb);
    return () => {
      this.scoreListeners.delete(cb);
    };
  }

  private notify() {
    const status = this.getStatus();
    const count = this.inMemoryQueue.length;
    for (const cb of this.listeners) {
      cb(status, count);
    }
  }

  private getStatus(): OutboxSyncStatus {
    if (!this.isOnline) return "offline";
    if (this.isFlushing) return "syncing";
    if (this.inMemoryQueue.length === 0) return "synced";
    return "syncing";
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notify();
    this.flush();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  public async init(): Promise<void> {
    try {
      const persisted = await get<OutboxRecord[]>(this.queueKey);
      if (Array.isArray(persisted) && persisted.length > 0) {
        this.inMemoryQueue = persisted;
      }
    } catch {
      this.isIndexedDbAvailable = false;
    }
    this.notify();
    if (this.isOnline && this.inMemoryQueue.length > 0) {
      void this.flush();
    }
  }

  private async persist(): Promise<void> {
    if (!this.isIndexedDbAvailable || typeof window === "undefined") return;
    try {
      await set(this.queueKey, this.inMemoryQueue);
    } catch {
      // IndexedDB storage error fallback
    }
  }

  public async enqueue(event: BatchEventItem): Promise<void> {
    const record: OutboxRecord = {
      id: event.id,
      matchId: this.matchId,
      payload: event,
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.inMemoryQueue.push(record);
    await this.persist();
    this.notify();

    if (this.isOnline && !this.isFlushing) {
      await this.flush().catch(() => {});
    }
  }

  public getPendingEvents(): BatchEventItem[] {
    return this.inMemoryQueue.map((r) => r.payload);
  }

  public getPendingCount(): number {
    return this.inMemoryQueue.length;
  }

  public async removeEvent(eventId: string): Promise<boolean> {
    const initialLen = this.inMemoryQueue.length;
    this.inMemoryQueue = this.inMemoryQueue.filter((item) => item.id !== eventId);
    if (this.inMemoryQueue.length !== initialLen) {
      await this.persist();
      this.notify();
      return true;
    }
    return false;
  }

  public async flush(): Promise<BatchEventsResponse | null> {
    if (this.isFlushing || this.inMemoryQueue.length === 0) {
      this.notify();
      return null;
    }

    if (!this.isOnline) {
      this.notify();
      return null;
    }

    this.isFlushing = true;
    this.notify();

    // Take up to 50 events in sequence (backend batch limit)
    const batch = this.inMemoryQueue.slice(0, 50);
    // Normalize types for backwards compatibility (e.g. TURNOVER_PERSONAL -> TURNOVER)
    const eventPayloads = batch.map((item) => {
      let normalizedType = item.payload.type;
      if ((normalizedType as string) === "TURNOVER_PERSONAL") normalizedType = "TURNOVER";
      if ((normalizedType as string) === "TURNOVER_TEAM") normalizedType = "TEAM_TURNOVER";
      return {
        ...item.payload,
        type: normalizedType,
      };
    });

    try {
      const response = await matchesApi.batchEvents(this.matchId, eventPayloads);

      // Remove successful batch items from inMemoryQueue
      const processedIds = new Set(eventPayloads.map((e) => e.id));
      this.inMemoryQueue = this.inMemoryQueue.filter((item) => !processedIds.has(item.id));
      await this.persist();

      this.isFlushing = false;
      this.notify();

      // If more events remain, flush again immediately
      if (this.inMemoryQueue.length > 0) {
        return this.flush();
      }

      if (response && typeof response.homeScore === "number" && typeof response.awayScore === "number") {
        for (const cb of this.scoreListeners) {
          cb(response.homeScore, response.awayScore);
        }
      }

      return response;
    } catch (_err: unknown) {
      this.isFlushing = false;

      const axiosErr = _err as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Array<{ field?: string; message?: string }> };
        };
      };
      const status = axiosErr?.response?.status;

      // 4xx errors (e.g. 400 Bad Request, Validation Error) are unrecoverable client errors.
      // Drop the invalid batch to prevent infinite retry loops.
      if (status && status >= 400 && status < 500) {
        const failingIds = new Set(eventPayloads.map((e) => e.id));
        this.inMemoryQueue = this.inMemoryQueue.filter((item) => !failingIds.has(item.id));
        await this.persist();
        this.notify();
        return null;
      }

      // Increment retryCount for network or 5xx server errors
      for (const item of batch) {
        item.retryCount += 1;
      }
      await this.persist();

      // Compute exponential backoff between 1s and 30s
      const minRetries = Math.min(...batch.map((b) => b.retryCount));
      const backoffMs = Math.min(30000, 1000 * 2 ** Math.min(minRetries, 5));

      for (const cb of this.listeners) {
        cb("error", this.inMemoryQueue.length);
      }

      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      this.retryTimeout = setTimeout(() => {
        this.retryTimeout = null;
        if (this.isOnline && this.inMemoryQueue.length > 0) {
          void this.flush().catch(() => {});
        }
      }, backoffMs);

      return null;
    }
  }

  public async clear(): Promise<void> {
    this.inMemoryQueue = [];
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    await this.persist();
    this.notify();
  }

  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.listeners.clear();
    this.scoreListeners.clear();
  }
}
