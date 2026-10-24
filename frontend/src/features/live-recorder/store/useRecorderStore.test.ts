import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchDetail } from "../../matches/types";
import { useRecorderStore } from "./useRecorderStore";

// Mock idb-keyval & matchesApi used by LiveRecorderOutbox
vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../matches/api/matches.api", () => ({
  matchesApi: {
    batchEvents: vi.fn().mockResolvedValue({
      events: [],
      homeScore: 1,
      awayScore: 1,
      lastSeq: 2,
    }),
  },
}));

const sampleMatch: MatchDetail = {
  id: 9,
  type: "SCRIMMAGE",
  format: "K4",
  status: "LIVE",
  homeTeamId: 1,
  awayTeamId: 1,
  homeTeamName: "Tim Kuning",
  awayTeamName: "Tim Biru",
  homeColor: "#FACC15",
  awayColor: "#3B82F6",
  homeScore: 1,
  awayScore: 0,
  currentPeriod: 1,
  periodCount: 4,
  periodDurationMinutes: 5,
  clockRemainingSeconds: 300,
  scheduledAt: "2026-10-20T10:00:00.000Z",
  trackShotZone: false,
  players: [
    {
      id: 101,
      matchId: 9,
      athleteId: 1,
      athleteName: "Dimas Home",
      sex: "MALE",
      jerseyNumber: 5,
      side: "HOME",
      isStarter: true,
      isOnCourt: true,
    },
    {
      id: 102,
      matchId: 9,
      athleteId: 2,
      athleteName: "Alifa Home",
      sex: "FEMALE",
      jerseyNumber: 8,
      side: "HOME",
      isStarter: true,
      isOnCourt: true,
    },
    {
      id: 201,
      matchId: 9,
      athleteId: 3,
      athleteName: "Guntur Away",
      sex: "MALE",
      jerseyNumber: 12,
      side: "AWAY",
      isStarter: true,
      isOnCourt: true,
    },
    {
      id: 202,
      matchId: 9,
      athleteId: 4,
      athleteName: "Laras Away",
      sex: "FEMALE",
      jerseyNumber: 18,
      side: "AWAY",
      isStarter: true,
      isOnCourt: true,
    },
  ],
  events: [
    {
      id: "ev-period-1",
      side: "HOME",
      type: "PERIOD_START",
      period: 1,
      clockSeconds: 300,
      clientRecordedAt: "2026-10-20T10:00:00.000Z",
    },
    {
      id: "ev-goal-1",
      side: "HOME",
      type: "SHOT_MADE",
      matchPlayerId: 101,
      period: 1,
      clockSeconds: 290,
      clientRecordedAt: "2026-10-20T10:00:10.000Z",
    },
  ],
};

describe("useRecorderStore", () => {
  beforeEach(() => {
    useRecorderStore.getState().destroy();
  });

  it("loads existing match events on initMatch and preserves events across server refetches", async () => {
    const store = useRecorderStore.getState();
    store.initMatch(sampleMatch);

    // Should load non-period events from match.events
    expect(useRecorderStore.getState().events).toHaveLength(1);
    expect(useRecorderStore.getState().events[0].id).toBe("ev-goal-1");

    // Record a new AWAY running-in goal locally
    await useRecorderStore.getState().recordEvent({
      type: "RUNNING_IN_MADE",
      side: "AWAY",
      matchPlayerId: 201,
      clockSeconds: 250,
    });

    expect(useRecorderStore.getState().events).toHaveLength(2);
    expect(useRecorderStore.getState().awayScore).toBe(1);
    expect(useRecorderStore.getState().homeScore).toBe(1);

    // Simulate React Query refetching the same match
    useRecorderStore.getState().initMatch({
      ...sampleMatch,
      homeScore: 1,
      awayScore: 1,
      currentPeriod: 2,
    });

    // Events must NOT be wiped out!
    expect(useRecorderStore.getState().events).toHaveLength(2);
    expect(useRecorderStore.getState().currentPeriod).toBe(2);
  });

  it("toggles player selection off when clicking the same player again and syncs selectedSide", () => {
    useRecorderStore.getState().initMatch(sampleMatch);

    // Select HOME player 101
    useRecorderStore.getState().setSelectedPlayerId(101);
    expect(useRecorderStore.getState().selectedPlayerId).toBe(101);
    expect(useRecorderStore.getState().selectedSide).toBe("HOME");

    // Click same HOME player 101 again -> should deselect (null)
    useRecorderStore.getState().setSelectedPlayerId(101);
    expect(useRecorderStore.getState().selectedPlayerId).toBeNull();

    // Select AWAY player 201 -> should set selectedPlayerId = 201 AND selectedSide = "AWAY"
    useRecorderStore.getState().setSelectedPlayerId(201);
    expect(useRecorderStore.getState().selectedPlayerId).toBe(201);
    expect(useRecorderStore.getState().selectedSide).toBe("AWAY");
  });

  it("records AWAY goals to awayScore and sets showAssistScorerPlayerId accurately", async () => {
    useRecorderStore.getState().initMatch(sampleMatch);

    await useRecorderStore.getState().recordEvent({
      type: "PENALTY_MADE",
      side: "AWAY",
      matchPlayerId: 202,
      clockSeconds: 200,
    });

    const state = useRecorderStore.getState();
    expect(state.homeScore).toBe(1); // Unchanged
    expect(state.awayScore).toBe(1); // Incremented for AWAY
    expect(state.showAssistScorerSide).toBe("AWAY");
    expect(state.showAssistScorerPlayerId).toBe(202);
    expect(state.showAssistGoalClockSeconds).toBe(200);
  });
});
