"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { matchesApi } from "../matches/api/matches.api";
import { useEndPeriod, useFinishMatch, useMatch, usePatchClock, useStartPeriod } from "../matches/hooks/useMatches";
import type { MatchEventType, MatchPlayerItem, MatchSide } from "../matches/types";
import { ActionPad } from "./components/ActionPad";
import { AssistSheet } from "./components/AssistSheet";
import { EventFeed } from "./components/EventFeed";
import { FinishMatchDialog } from "./components/FinishMatchDialog";
import { PlayerGrid } from "./components/PlayerGrid";
import { Scoreboard } from "./components/Scoreboard";
import { ShotZonePicker } from "./components/ShotZonePicker";
import { SubstitutionModal } from "./components/SubstitutionModal";
import { formatClock, useMatchClock } from "./hooks/useMatchClock";
import { useRecorderStore } from "./store/useRecorderStore";

interface LiveRecorderPageProps {
  matchId: number;
}

export function LiveRecorderPage({ matchId }: LiveRecorderPageProps) {
  const router = useRouter();
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);

  const {
    players,
    homeScore,
    awayScore,
    currentPeriod,
    selectedPlayerId,
    selectedSide,
    selectedAction,
    events,
    syncStatus,
    pendingCount,
    outbox,
    showAssistSheetForEventId,
    showAssistScorerSide,
    showAssistScorerPlayerId,
    showShotZoneModal,
    pendingShotAction,
    initMatch,
    destroy,
    setSelectedPlayerId,
    setSelectedSide,
    setSelectedAction,
    setPeriod,
    setShowAssistSheetForEventId,
    setShowShotZoneModal,
    setPendingShotAction,
    recordEvent,
    undoLastEvent,
    applySubstitutionLocally,
  } = useRecorderStore();

  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [subModalSide, setSubModalSide] = useState<MatchSide | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const patchClockMutation = usePatchClock(matchId);
  const startPeriodMutation = useStartPeriod(matchId);
  const endPeriodMutation = useEndPeriod(matchId);
  const finishMatchMutation = useFinishMatch(matchId);

  // Sync match data into store when loaded/updated
  useEffect(() => {
    if (match) {
      initMatch(match);
    }
  }, [match, initMatch]);

  // Destroy outbox and store only on component unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  // Screen Wake Lock API implementation
  useEffect(() => {
    const requestWakeLock = async () => {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          setWakeLockActive(true);
          wakeLockRef.current.addEventListener("release", () => {
            setWakeLockActive(false);
          });
        } catch {
          setWakeLockActive(false);
        }
      }
    };

    void requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        void wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Clock sync handler
  const handleSyncClock = useCallback(
    (remainingSeconds: number, isRunning: boolean) => {
      patchClockMutation.mutate({
        currentPeriod,
        clockRemainingSeconds: remainingSeconds,
        clockRunningSince: isRunning ? new Date().toISOString() : null,
      });
    },
    [currentPeriod, patchClockMutation],
  );

  const handlePeriodZero = useCallback(() => {
    toast.info(`Waktu babak ${currentPeriod} habis!`, {
      description: "Jam otomatis dijeda. Klik tombol Akhiri Babak untuk melanjutkan.",
    });
  }, [currentPeriod]);

  const periodDurationSeconds = (match?.periodDurationMinutes ?? 10) * 60;

  // Clock instance
  const clock = useMatchClock({
    matchId: match?.id,
    initialRemainingSeconds: match?.clockRemainingSeconds ?? periodDurationSeconds,
    defaultDurationSeconds: periodDurationSeconds,
    initialIsRunning: Boolean(match?.clockIsRunning ?? match?.clockRunningSince),
    initialRunningSince: match?.clockRunningSince,
    onSyncClock: handleSyncClock,
    onPeriodZero: handlePeriodZero,
  });

  // Unified helper to execute an action for a specific player (used by both Player-First and Action-First)
  const executePlayerAction = useCallback(
    async (player: MatchPlayerItem, type: MatchEventType) => {
      const isShot =
        type === "SHOT_MADE" ||
        type === "SHOT_MISSED" ||
        type === "RUNNING_IN_MADE" ||
        type === "RUNNING_IN_MISSED" ||
        type === "PENALTY_MADE" ||
        type === "PENALTY_MISSED";

      if (isShot && match?.trackShotZone) {
        setSelectedAction(null);
        setSelectedPlayerId(null);
        setPendingShotAction({
          type,
          side: player.side,
          matchPlayerId: player.id,
        });
        setShowShotZoneModal(true);
        return;
      }

      try {
        await recordEvent({
          type,
          side: player.side,
          matchPlayerId: player.id,
          clockSeconds: clock.remainingSeconds,
        });
      } catch {
        toast.error("Gagal mencatat aksi.");
      }
    },
    [
      match?.trackShotZone,
      clock.remainingSeconds,
      recordEvent,
      setSelectedAction,
      setSelectedPlayerId,
      setPendingShotAction,
      setShowShotZoneModal,
    ],
  );

  // Player Selection Handler (supports both Player-First selection and Action-First completion)
  const handleSelectPlayer = useCallback(
    (playerId: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      if (selectedAction) {
        void executePlayerAction(player, selectedAction);
        return;
      }

      setSelectedPlayerId(playerId);
    },
    [players, selectedAction, executePlayerAction, setSelectedPlayerId],
  );

  // Action Click Handler
  const handleActionClick = useCallback(
    async (type: MatchEventType) => {
      if (selectedPlayerId) {
        const player = players.find((p) => p.id === selectedPlayerId);
        if (!player) return;
        await executePlayerAction(player, type);
      } else {
        if (selectedAction === type) {
          setSelectedAction(null);
        } else {
          setSelectedAction(type);
        }
      }
    },
    [selectedPlayerId, selectedAction, players, executePlayerAction, setSelectedAction],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedPlayerId(null);
    setSelectedAction(null);
  }, [setSelectedPlayerId, setSelectedAction]);

  // Shot zone confirmation
  const handleConfirmShotZone = useCallback(
    async (sector: number | null, distanceZone: number | null) => {
      setShowShotZoneModal(false);
      if (!pendingShotAction) return;

      try {
        await recordEvent({
          type: pendingShotAction.type,
          side: pendingShotAction.side,
          matchPlayerId: pendingShotAction.matchPlayerId,
          clockSeconds: clock.remainingSeconds,
          shotSector: sector,
          shotDistanceZone: distanceZone,
        });
      } catch {
        toast.error("Gagal mencatat tembakan berzona.");
      } finally {
        setPendingShotAction(null);
      }
    },
    [pendingShotAction, clock.remainingSeconds, recordEvent, setShowShotZoneModal, setPendingShotAction],
  );

  // Team Turnover & Timeout handlers
  const handleTeamTurnover = useCallback(
    async (targetSide?: MatchSide) => {
      const side = targetSide ?? selectedSide;
      const teamLabel = side === "HOME" ? match?.homeTeamName || "HOME" : match?.awayTeamName || "AWAY";
      try {
        await recordEvent({
          type: "TEAM_TURNOVER",
          side,
          matchPlayerId: null,
          clockSeconds: clock.remainingSeconds,
        });
        toast.success(`Team Turnover dicatat untuk ${side} (${teamLabel})`);
      } catch {
        toast.error("Gagal mencatat team turnover.");
      }
    },
    [recordEvent, selectedSide, clock.remainingSeconds, match?.homeTeamName, match?.awayTeamName],
  );

  const handleTeamTimeout = useCallback(
    async (targetSide?: MatchSide) => {
      const side = targetSide ?? selectedSide;
      const teamLabel = side === "HOME" ? match?.homeTeamName || "HOME" : match?.awayTeamName || "AWAY";
      clock.pause();
      try {
        await recordEvent({
          type: "TIMEOUT",
          side,
          matchPlayerId: null,
          clockSeconds: clock.remainingSeconds,
        });
        toast.success(`Time-out dicatat untuk ${side} (${teamLabel})`);
      } catch {
        toast.error("Gagal mencatat time-out.");
      }
    },
    [clock, recordEvent, selectedSide, match?.homeTeamName, match?.awayTeamName],
  );

  // Assist selection
  const handleSelectAssist = useCallback(
    async (assistPlayerId: number) => {
      if (!showAssistSheetForEventId || !showAssistScorerSide) return;
      try {
        await recordEvent({
          type: "ASSIST",
          side: showAssistScorerSide,
          matchPlayerId: assistPlayerId,
          relatedEventId: showAssistSheetForEventId,
          clockSeconds: clock.remainingSeconds,
        });
        toast.success("Assist berhasil dicatat.");
      } catch {
        toast.error("Gagal mencatat assist.");
      } finally {
        setShowAssistSheetForEventId(null);
      }
    },
    [
      showAssistSheetForEventId,
      showAssistScorerSide,
      recordEvent,
      clock.remainingSeconds,
      setShowAssistSheetForEventId,
    ],
  );

  // Substitution confirm
  const handleConfirmSub = useCallback(
    async (outPlayerId: number, inPlayerId: number) => {
      if (!subModalSide) return;
      try {
        await recordEvent({
          type: "SUBSTITUTION",
          side: subModalSide,
          matchPlayerId: outPlayerId,
          subInPlayerId: inPlayerId,
          clockSeconds: clock.remainingSeconds,
        });
        applySubstitutionLocally(outPlayerId, inPlayerId);
        toast.success("Substitusi pemain berhasil dicatat.");
      } catch {
        toast.error("Gagal mencatat substitusi.");
      }
    },
    [subModalSide, recordEvent, clock.remainingSeconds, applySubstitutionLocally],
  );

  // Delete any specific event or undo last event
  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        if (outbox) {
          await outbox.removeEvent(eventId);
        }
        await matchesApi.deleteEvent(matchId, eventId).catch((err: unknown) => {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr?.response?.status !== 404) {
            throw err;
          }
        });
        undoLastEvent(eventId);
        toast.info("Event berhasil dibatalkan.");
      } catch {
        toast.error("Gagal membatalkan event.");
      }
    },
    [matchId, outbox, undoLastEvent],
  );

  // Undo last event
  const handleUndoLast = useCallback(async () => {
    const latestEvent = events[0];
    if (!latestEvent) return;
    await handleDeleteEvent(latestEvent.id);
  }, [events, handleDeleteEvent]);

  // Period start / end / switch handlers
  const handleStartPeriod = useCallback(() => {
    clock.setTime(periodDurationSeconds);
    clock.start();
    startPeriodMutation.mutate(currentPeriod, {
      onSuccess: () => {
        toast.success(`Babak ${currentPeriod} resmi dimulai!`);
      },
      onError: () => {
        toast.error(`Gagal memulai Babak ${currentPeriod}.`);
      },
    });
  }, [clock, currentPeriod, periodDurationSeconds, startPeriodMutation]);

  const handleEndPeriod = useCallback(() => {
    const endedPeriod = currentPeriod;
    const totalPeriods = match?.periodCount ?? 2;

    clock.pause();
    endPeriodMutation.mutate(endedPeriod, {
      onSuccess: () => {
        if (endedPeriod < totalPeriods) {
          const nextPeriod = endedPeriod + 1;
          setPeriod(nextPeriod);
          clock.setTime(periodDurationSeconds);
          toast.success(`Babak ${endedPeriod} diakhiri. Sekarang di Babak ${nextPeriod}!`, {
            description: `Jam direset ke ${formatClock(periodDurationSeconds)}. Klik 'Mulai' untuk menjalankan Babak ${nextPeriod}.`,
          });
        } else {
          clock.setTime(0);
          toast.success(`Babak terakhir (Babak ${endedPeriod}) telah diakhiri.`, {
            description: "Klik tombol 'Selesai' jika pertandingan telah usai.",
          });
        }
      },
      onError: () => {
        toast.error(`Gagal mengakhiri Babak ${endedPeriod}.`);
      },
    });
  }, [clock, currentPeriod, endPeriodMutation, match?.periodCount, periodDurationSeconds, setPeriod]);

  const handleSelectPeriod = useCallback(
    (targetPeriod: number) => {
      if (targetPeriod === currentPeriod) return;
      clock.pause();
      setPeriod(targetPeriod);
      clock.setTime(periodDurationSeconds);
      patchClockMutation.mutate({
        currentPeriod: targetPeriod,
        clockRemainingSeconds: periodDurationSeconds,
        clockRunningSince: null,
      });
      toast.info(`Berpindah ke Babak ${targetPeriod}.`);
    },
    [clock, currentPeriod, patchClockMutation, periodDurationSeconds, setPeriod],
  );

  // Finish match confirmation
  const handleConfirmFinish = useCallback(() => {
    finishMatchMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Pertandingan berhasil diselesaikan!");
        setShowFinishDialog(false);
        router.push(`/matches/${matchId}/box-score`);
      },
      onError: () => {
        toast.error("Gagal menyelesaikan pertandingan.");
      },
    });
  }, [finishMatchMutation, matchId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat data live recorder...</span>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-destructive font-semibold">Gagal memuat pertandingan.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw size={14} />
          <span>Coba Lagi</span>
        </Button>
      </div>
    );
  }

  const homePlayers = players.filter((p) => p.side === "HOME");
  const awayPlayers = players.filter((p) => p.side === "AWAY");
  const selectedPlayer = selectedPlayerId ? (players.find((p) => p.id === selectedPlayerId) ?? null) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background -m-4 sm:-m-6">
      {/* Sticky Top Scoreboard */}
      <Scoreboard
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        homeColor={match.homeColor}
        awayColor={match.awayColor}
        homeScore={homeScore}
        awayScore={awayScore}
        currentPeriod={currentPeriod}
        totalPeriods={match.periodCount}
        formattedClock={clock.formattedTime}
        isClockRunning={clock.isRunning}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        wakeLockActive={wakeLockActive}
        onToggleClock={clock.toggle}
        onStartPeriod={handleStartPeriod}
        onEndPeriod={handleEndPeriod}
        onSelectPeriod={handleSelectPeriod}
        onFinishMatch={() => setShowFinishDialog(true)}
      />

      {/* Main Interactive Recorder Canvas */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Tablet / Desktop Landscape 3-Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-start">
          {/* Column 1: Home Team Players (4 cols) */}
          <div className="lg:col-span-4 bg-card/60 rounded-2xl border border-border p-3.5 shadow-xs">
            <PlayerGrid
              side="HOME"
              teamName={match.homeTeamName}
              teamColor={match.homeColor}
              players={homePlayers}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
              onOpenSubModal={() => setSubModalSide("HOME")}
            />
          </div>

          {/* Column 2: Action Pad & Event Feed (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <ActionPad
              hasSelectedPlayer={Boolean(selectedPlayerId)}
              selectedPlayer={selectedPlayer}
              selectedAction={selectedAction}
              selectedSide={selectedSide}
              homeTeamName={match.homeTeamName}
              awayTeamName={match.awayTeamName}
              homeColor={match.homeColor}
              awayColor={match.awayColor}
              onSelectSide={setSelectedSide}
              onClearSelection={handleClearSelection}
              onActionClick={handleActionClick}
              onTeamTurnover={handleTeamTurnover}
              onTeamTimeout={handleTeamTimeout}
            />

            <EventFeed
              events={events}
              players={players}
              homeTeamName={match.homeTeamName}
              awayTeamName={match.awayTeamName}
              onUndoLast={handleUndoLast}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>

          {/* Column 3: Away Team Players (4 cols) */}
          <div className="lg:col-span-4 bg-card/60 rounded-2xl border border-border p-3.5 shadow-xs">
            <PlayerGrid
              side="AWAY"
              teamName={match.awayTeamName}
              teamColor={match.awayColor}
              players={awayPlayers}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
              onOpenSubModal={() => setSubModalSide("AWAY")}
            />
          </div>
        </div>

        {/* Mobile / Tablet Portrait Layout with Team Tabs */}
        <div className="lg:hidden flex flex-col gap-3">
          {/* Team Switcher Tabs */}
          <Tabs
            value={selectedSide}
            onValueChange={(val) => {
              setSelectedSide(val as MatchSide);
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full h-11">
              <TabsTrigger value="HOME" className="gap-2 font-bold text-xs truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: match.homeColor || "#FACC15" }}
                />
                <span className="truncate">{match.homeTeamName}</span>
              </TabsTrigger>
              <TabsTrigger value="AWAY" className="gap-2 font-bold text-xs truncate">
                <span className="truncate">{match.awayTeamName}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: match.awayColor || "#3B82F6" }}
                />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Active Side Player Grid */}
          <div className="bg-card/70 rounded-2xl border border-border p-3 shadow-xs">
            <PlayerGrid
              side={selectedSide}
              teamName={selectedSide === "HOME" ? match.homeTeamName : match.awayTeamName}
              teamColor={selectedSide === "HOME" ? match.homeColor : match.awayColor}
              players={selectedSide === "HOME" ? homePlayers : awayPlayers}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
              onOpenSubModal={() => setSubModalSide(selectedSide)}
            />
          </div>

          {/* Action Pad */}
          <ActionPad
            hasSelectedPlayer={Boolean(selectedPlayerId)}
            selectedPlayer={selectedPlayer}
            selectedAction={selectedAction}
            selectedSide={selectedSide}
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            homeColor={match.homeColor}
            awayColor={match.awayColor}
            onSelectSide={setSelectedSide}
            onClearSelection={handleClearSelection}
            onActionClick={handleActionClick}
            onTeamTurnover={handleTeamTurnover}
            onTeamTimeout={handleTeamTimeout}
          />

          {/* Recent Event Feed */}
          <EventFeed
            events={events}
            players={players}
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            onUndoLast={handleUndoLast}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </main>

      {/* Modals & Overlays */}
      {showAssistSheetForEventId && showAssistScorerSide && (
        <AssistSheet
          goalEventId={showAssistSheetForEventId}
          side={showAssistScorerSide}
          scorerPlayerId={showAssistScorerPlayerId}
          players={players}
          onSelectAssist={handleSelectAssist}
          onDismiss={() => setShowAssistSheetForEventId(null)}
        />
      )}

      {showShotZoneModal && (
        <ShotZonePicker
          open={showShotZoneModal}
          onConfirm={handleConfirmShotZone}
          onCancel={() => {
            setShowShotZoneModal(false);
            setPendingShotAction(null);
          }}
        />
      )}

      {subModalSide && (
        <SubstitutionModal
          open={Boolean(subModalSide)}
          side={subModalSide}
          teamName={subModalSide === "HOME" ? match.homeTeamName : match.awayTeamName}
          players={players}
          onConfirm={handleConfirmSub}
          onClose={() => setSubModalSide(null)}
        />
      )}

      {showFinishDialog && (
        <FinishMatchDialog
          open={showFinishDialog}
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
          homeScore={homeScore}
          awayScore={awayScore}
          pendingCount={pendingCount}
          isFinishing={finishMatchMutation.isPending}
          onConfirmFinish={handleConfirmFinish}
          onClose={() => setShowFinishDialog(false)}
        />
      )}
    </div>
  );
}
