import { beforeEach, describe, expect, it, vi } from "vitest";
import { matchesApi } from "../../matches/api/matches.api";
import type { BatchEventItem, OutboxSyncStatus } from "../../matches/types";
import { LiveRecorderOutbox } from "./outbox";

// Mock idb-keyval
vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

// Mock matchesApi
vi.mock("../../matches/api/matches.api", () => ({
  matchesApi: {
    batchEvents: vi.fn(),
  },
}));

describe("LiveRecorderOutbox", () => {
  let outbox: LiveRecorderOutbox;

  const sampleEvent: BatchEventItem = {
    id: "11111111-1111-1111-1111-111111111111",
    side: "HOME",
    type: "SHOT_MADE",
    matchPlayerId: 1,
    period: 1,
    clockSeconds: 580,
    clientRecordedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    outbox = new LiveRecorderOutbox(101);
  });

  it("should initialize empty and report synced", async () => {
    let currentStatus: OutboxSyncStatus = "error";
    let pending = -1;

    outbox.subscribe((status, count) => {
      currentStatus = status;
      pending = count;
    });

    await outbox.init();
    expect(currentStatus).toBe("synced");
    expect(pending).toBe(0);
    expect(outbox.getPendingCount()).toBe(0);
  });

  it("should enqueue event and automatically flush to backend API", async () => {
    const mockBatchResponse = {
      events: [
        { id: sampleEvent.id, seq: 1, side: "HOME" as const, type: sampleEvent.type, period: 1, clockSeconds: 580 },
      ],
      homeScore: 1,
      awayScore: 0,
      lastSeq: 1,
    };

    vi.mocked(matchesApi.batchEvents).mockResolvedValueOnce(mockBatchResponse);

    const statusUpdates: { status: OutboxSyncStatus; pending: number }[] = [];
    outbox.subscribe((status, count) => {
      statusUpdates.push({ status, pending: count });
    });

    await outbox.enqueue(sampleEvent);

    expect(matchesApi.batchEvents).toHaveBeenCalledWith(101, [sampleEvent]);
    expect(outbox.getPendingCount()).toBe(0);
  });

  it("should handle backend failure and report error state", async () => {
    vi.mocked(matchesApi.batchEvents).mockRejectedValueOnce(new Error("Network disconnect"));

    let lastStatus: OutboxSyncStatus = "synced";
    outbox.subscribe((status) => {
      lastStatus = status;
    });

    await outbox.enqueue(sampleEvent);

    expect(lastStatus).toBe("error");
    expect(outbox.getPendingCount()).toBe(1);
  });

  it("should remove event from queue when removeEvent is called", async () => {
    vi.mocked(matchesApi.batchEvents).mockRejectedValueOnce(new Error("Network disconnect"));
    await outbox.enqueue(sampleEvent);
    expect(outbox.getPendingCount()).toBe(1);

    const removed = await outbox.removeEvent(sampleEvent.id);
    expect(removed).toBe(true);
    expect(outbox.getPendingCount()).toBe(0);
  });

  it("should drop invalid batch and not retry on 4xx client validation error", async () => {
    const error400 = { response: { status: 400, data: { message: "Validation failed" } } };
    vi.mocked(matchesApi.batchEvents).mockRejectedValueOnce(error400);

    await outbox.enqueue(sampleEvent);
    // Queue should be purged of the invalid batch
    expect(outbox.getPendingCount()).toBe(0);
  });
});
