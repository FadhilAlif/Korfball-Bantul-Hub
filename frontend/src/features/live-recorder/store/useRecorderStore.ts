import { create } from "zustand";
import type {
  BatchEventItem,
  MatchDetail,
  MatchEventType,
  MatchPlayerItem,
  MatchSide,
  OutboxSyncStatus,
} from "../../matches/types";
import { LiveRecorderOutbox } from "../lib/outbox";

function buildPlayersFromMatch(match: MatchDetail): MatchPlayerItem[] {
  const rawPlayers = match.players || match.lineup || [];
  const courtState = match.courtState;

  if (courtState) {
    const onCourtIds = new Set([...courtState.home.onCourtPlayerIds, ...courtState.away.onCourtPlayerIds]);
    const redCardIds = new Set([...courtState.home.redCardPlayerIds, ...courtState.away.redCardPlayerIds]);
    return rawPlayers.map((p) => ({
      ...p,
      isOnCourt: onCourtIds.has(p.id),
      hasRedCard: redCardIds.has(p.id),
    }));
  }

  return rawPlayers.map((p) => ({
    ...p,
    isOnCourt: p.isStarter,
    hasRedCard: false,
  }));
}

function buildEventsFromMatch(match: MatchDetail, currentEvents: BatchEventItem[]): BatchEventItem[] {
  const serverEvents = (match.events || [])
    .filter((e) => e.type !== "PERIOD_START" && e.type !== "PERIOD_END")
    .map((e) => ({
      id: e.id,
      side: e.side,
      type: e.type,
      matchPlayerId: e.matchPlayerId ?? null,
      subInPlayerId: e.subInPlayerId ?? null,
      relatedEventId: e.relatedEventId ?? null,
      period: e.period,
      clockSeconds: e.clockSeconds,
      shotSector: e.shotSector ?? null,
      shotDistanceZone: e.shotDistanceZone ?? null,
      note: e.note ?? null,
      clientRecordedAt:
        typeof e.clientRecordedAt === "string"
          ? e.clientRecordedAt
          : e.clientRecordedAt
            ? new Date(e.clientRecordedAt).toISOString()
            : new Date().toISOString(),
    }))
    .reverse(); // Newest first for EventFeed

  const serverIds = new Set(serverEvents.map((e) => e.id));
  const unsyncedLocal = currentEvents.filter((e) => !serverIds.has(e.id));

  return [...unsyncedLocal, ...serverEvents];
}

export interface RecorderState {
  match: MatchDetail | null;
  players: MatchPlayerItem[];
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  selectedPlayerId: number | null;
  selectedSide: MatchSide;
  selectedAction: MatchEventType | null;
  events: BatchEventItem[];
  outbox: LiveRecorderOutbox | null;
  syncStatus: OutboxSyncStatus;
  pendingCount: number;
  showAssistSheetForEventId: string | null;
  showAssistScorerSide: MatchSide | null;
  showAssistScorerPlayerId: number | null;
  showShotZoneModal: boolean;
  pendingShotAction: {
    type: MatchEventType;
    side: MatchSide;
    matchPlayerId: number;
  } | null;

  // Actions
  initMatch: (match: MatchDetail) => void;
  destroy: () => void;
  setSelectedPlayerId: (id: number | null) => void;
  setSelectedSide: (side: MatchSide) => void;
  setSelectedAction: (action: MatchEventType | null) => void;
  setPeriod: (period: number) => void;
  setScores: (home: number, away: number) => void;
  setSyncStatus: (status: OutboxSyncStatus, pending: number) => void;
  setShowAssistSheetForEventId: (
    eventId: string | null,
    side?: MatchSide | null,
    scorerPlayerId?: number | null,
  ) => void;
  setShowShotZoneModal: (show: boolean) => void;
  setPendingShotAction: (action: { type: MatchEventType; side: MatchSide; matchPlayerId: number } | null) => void;

  // Event recording
  recordEvent: (options: {
    type: MatchEventType;
    side: MatchSide;
    matchPlayerId?: number | null;
    subInPlayerId?: number | null;
    relatedEventId?: string | null;
    clockSeconds: number;
    shotSector?: number | null;
    shotDistanceZone?: number | null;
    note?: string | null;
  }) => Promise<string>;

  undoLastEvent: (eventId: string) => void;
  applySubstitutionLocally: (outPlayerId: number, inPlayerId: number) => void;
}

export const useRecorderStore = create<RecorderState>((set, get) => ({
  match: null,
  players: [],
  homeScore: 0,
  awayScore: 0,
  currentPeriod: 1,
  selectedPlayerId: null,
  selectedSide: "HOME",
  selectedAction: null,
  events: [],
  outbox: null,
  syncStatus: "synced",
  pendingCount: 0,
  showAssistSheetForEventId: null,
  showAssistScorerSide: null,
  showAssistScorerPlayerId: null,
  showShotZoneModal: false,
  pendingShotAction: null,

  initMatch: (match: MatchDetail) => {
    const state = get();

    // If already initialized for this exact match, sync non-destructively without wiping outbox or events
    if (state.match?.id === match.id && state.outbox !== null) {
      const hasPending = state.outbox.getPendingCount() > 0;
      const mergedEvents = buildEventsFromMatch(match, state.events);

      set({
        match,
        events: mergedEvents,
        ...(hasPending
          ? {}
          : {
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              players: buildPlayersFromMatch(match),
            }),
        currentPeriod: match.currentPeriod || state.currentPeriod || 1,
      });
      return;
    }

    if (state.outbox) {
      state.outbox.destroy();
    }

    const outbox = new LiveRecorderOutbox(match.id);
    void outbox.init();
    outbox.subscribe((status, count) => {
      set({ syncStatus: status, pendingCount: count });
    });
    outbox.subscribeScoreSync((homeScore, awayScore) => {
      set({ homeScore, awayScore });
    });

    const players = buildPlayersFromMatch(match);
    const events = buildEventsFromMatch(match, []);

    set({
      match,
      players,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      currentPeriod: match.currentPeriod || 1,
      outbox,
      selectedPlayerId: null,
      selectedAction: null,
      events,
    });
  },

  destroy: () => {
    const outbox = get().outbox;
    if (outbox) {
      outbox.destroy();
    }
    set({
      match: null,
      players: [],
      outbox: null,
      events: [],
      selectedPlayerId: null,
      selectedAction: null,
      showAssistSheetForEventId: null,
      showAssistScorerSide: null,
      showAssistScorerPlayerId: null,
    });
  },

  setSelectedPlayerId: (id) => {
    const { selectedPlayerId, players } = get();
    // Toggle off if clicking the same player again
    if (id !== null && selectedPlayerId === id) {
      set({ selectedPlayerId: null });
      return;
    }

    if (id !== null) {
      const player = players.find((p) => p.id === id);
      if (player) {
        set({ selectedPlayerId: id, selectedSide: player.side });
        return;
      }
    }

    set({ selectedPlayerId: id });
  },

  setSelectedSide: (side) => set({ selectedSide: side, selectedPlayerId: null }),
  setSelectedAction: (action) => set({ selectedAction: action }),
  setPeriod: (period) => set({ currentPeriod: period }),
  setScores: (homeScore, awayScore) => set({ homeScore, awayScore }),
  setSyncStatus: (syncStatus, pendingCount) => set({ syncStatus, pendingCount }),
  setShowAssistSheetForEventId: (eventId, side = null, scorerPlayerId = null) =>
    set({
      showAssistSheetForEventId: eventId,
      showAssistScorerSide: side,
      showAssistScorerPlayerId: scorerPlayerId,
    }),
  setShowShotZoneModal: (show) => set({ showShotZoneModal: show }),
  setPendingShotAction: (pending) => set({ pendingShotAction: pending }),

  recordEvent: async (options) => {
    const { outbox, currentPeriod, homeScore, awayScore, players } = get();
    const eventId = crypto.randomUUID();

    const newEvent: BatchEventItem = {
      id: eventId,
      side: options.side,
      type: options.type,
      matchPlayerId: options.matchPlayerId ?? null,
      subInPlayerId: options.subInPlayerId ?? null,
      relatedEventId: options.relatedEventId ?? null,
      period: currentPeriod,
      clockSeconds: options.clockSeconds,
      shotSector: options.shotSector ?? null,
      shotDistanceZone: options.shotDistanceZone ?? null,
      note: options.note ?? null,
      clientRecordedAt: new Date().toISOString(),
    };

    // Optimistic score updates for goals
    let nextHomeScore = homeScore;
    let nextAwayScore = awayScore;
    const isGoal =
      options.type === "SHOT_MADE" || options.type === "RUNNING_IN_MADE" || options.type === "PENALTY_MADE";

    if (isGoal) {
      if (options.side === "HOME") {
        nextHomeScore += 1;
      } else {
        nextAwayScore += 1;
      }
    }

    // Optimistic player status updates for red card
    let nextPlayers = players;
    if (options.type === "RED_CARD" && options.matchPlayerId) {
      nextPlayers = players.map((p) =>
        p.id === options.matchPlayerId ? { ...p, isOnCourt: false, hasRedCard: true } : p,
      );
    }

    // Optimistic substitution
    if (options.type === "SUBSTITUTION" && options.matchPlayerId && options.subInPlayerId) {
      nextPlayers = players.map((p) => {
        if (p.id === options.matchPlayerId) return { ...p, isOnCourt: false };
        if (p.id === options.subInPlayerId) return { ...p, isOnCourt: true };
        return p;
      });
    }

    set((state) => ({
      homeScore: nextHomeScore,
      awayScore: nextAwayScore,
      players: nextPlayers,
      selectedSide: options.side,
      events: [newEvent, ...state.events.slice(0, 99)],
      selectedPlayerId: null,
      selectedAction: null,
    }));

    // Trigger haptic feedback if supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(isGoal ? [30, 50, 30] : 15);
      } catch {
        // ignore
      }
    }

    // Queue in outbox
    if (outbox) {
      await outbox.enqueue(newEvent);
    }

    // If it's a goal, prompt assist sheet with accurate scorer info
    if (isGoal) {
      set({
        showAssistSheetForEventId: eventId,
        showAssistScorerSide: options.side,
        showAssistScorerPlayerId: options.matchPlayerId ?? null,
      });
    }

    return eventId;
  },

  undoLastEvent: (eventId: string) => {
    set((state) => {
      const target = state.events.find((e) => e.id === eventId);
      if (!target) return state;

      let nextHomeScore = state.homeScore;
      let nextAwayScore = state.awayScore;
      const isGoal = target.type === "SHOT_MADE" || target.type === "RUNNING_IN_MADE" || target.type === "PENALTY_MADE";

      if (isGoal) {
        if (target.side === "HOME") {
          nextHomeScore = Math.max(0, nextHomeScore - 1);
        } else {
          nextAwayScore = Math.max(0, nextAwayScore - 1);
        }
      }

      let nextPlayers = state.players;
      if (target.type === "RED_CARD" && target.matchPlayerId) {
        nextPlayers = state.players.map((p) =>
          p.id === target.matchPlayerId ? { ...p, hasRedCard: false, isOnCourt: true } : p,
        );
      } else if (target.type === "SUBSTITUTION" && target.matchPlayerId && target.subInPlayerId) {
        nextPlayers = state.players.map((p) => {
          if (p.id === target.matchPlayerId) return { ...p, isOnCourt: true };
          if (p.id === target.subInPlayerId) return { ...p, isOnCourt: false };
          return p;
        });
      }

      return {
        events: state.events.filter((e) => e.id !== eventId),
        homeScore: nextHomeScore,
        awayScore: nextAwayScore,
        players: nextPlayers,
      };
    });
  },

  applySubstitutionLocally: (outPlayerId: number, inPlayerId: number) => {
    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === outPlayerId) return { ...p, isOnCourt: false };
        if (p.id === inPlayerId) return { ...p, isOnCourt: true };
        return p;
      }),
    }));
  },
}));
