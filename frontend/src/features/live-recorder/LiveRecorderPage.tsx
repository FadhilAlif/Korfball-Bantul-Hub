"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { matchesApi } from "../matches/api/matches.api";
import { useEndPeriod, useFinishMatch, useMatch, usePatchClock, useStartPeriod } from "../matches/hooks/useMatches";
import type { MatchEventType, MatchSide } from "../matches/types";
import { ActionPad } from "./components/ActionPad";
import { AssistSheet } from "./components/AssistSheet";
import { EventFeed } from "./components/EventFeed";
import { FinishMatchDialog } from "./components/FinishMatchDialog";
import { PlayerGrid } from "./components/PlayerGrid";
import { Scoreboard } from "./components/Scoreboard";
import { ShotZonePicker } from "./components/ShotZonePicker";
import { SubstitutionModal } from "./components/SubstitutionModal";
import { useMatchClock } from "./hooks/useMatchClock";
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
    showAssistSheetForEventId,
    showAssistScorerSide,
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

  // Initialize store when match data loads
  useEffect(() => {
    if (match) {
      initMatch(match);
    }
    return () => {
      destroy();
    };
  }, [match, initMatch, destroy]);

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
      description: "Jam otomatis dijeda. Akhiri babak ini jika permainan selesai.",
    });
  }, [currentPeriod]);

  // Clock instance
  const clock = useMatchClock({
    initialRemainingSeconds: match?.clockRemainingSeconds ?? 600,
    initialIsRunning: Boolean(match?.clockIsRunning),
    initialRunningSince: match?.clockRunningSince,
    onSyncClock: handleSyncClock,
    onPeriodZero: handlePeriodZero,
  });

  // Action Click Handler
  const handleActionClick = useCallback(
    async (type: MatchEventType) => {
      // If a player is already selected:
      if (selectedPlayerId) {
        const player = players.find((p) => p.id === selectedPlayerId);
        if (!player) return;

        const isShot =
          type === "SHOT_MADE" ||
          type === "SHOT_MISSED" ||
          type === "RUNNING_IN_MADE" ||
          type === "RUNNING_IN_MISSED" ||
          type === "PENALTY_MADE" ||
          type === "PENALTY_MISSED";

        // If match tracks shot zones, prompt modal first
        if (isShot && match?.trackShotZone) {
          setPendingShotAction({
            type,
            side: player.side,
            matchPlayerId: player.id,
          });
          setShowShotZoneModal(true);
          return;
        }

        // Otherwise record immediately
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
      } else {
        // No player selected: enter Action-First mode
        if (selectedAction === type) {
          setSelectedAction(null); // Deselect if tapped again
        } else {
          setSelectedAction(type);
        }
      }
    },
    [
      selectedPlayerId,
      selectedAction,
      players,
      match?.trackShotZone,
      clock.remainingSeconds,
      recordEvent,
      setPendingShotAction,
      setShowShotZoneModal,
      setSelectedAction,
    ],
  );

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
  const handleTeamTurnover = useCallback(async () => {
    try {
      await recordEvent({
        type: "TURNOVER_TEAM",
        side: selectedSide,
        matchPlayerId: null,
        clockSeconds: clock.remainingSeconds,
      });
      toast.success(`Team turnover dicatat untuk ${selectedSide}`);
    } catch {
      toast.error("Gagal mencatat team turnover.");
    }
  }, [recordEvent, selectedSide, clock.remainingSeconds]);

  const handleTeamTimeout = useCallback(async () => {
    clock.pause();
    try {
      await recordEvent({
        type: "TIMEOUT",
        side: selectedSide,
        matchPlayerId: null,
        clockSeconds: clock.remainingSeconds,
      });
      toast.success(`Time-out dicatat untuk ${selectedSide}`);
    } catch {
      toast.error("Gagal mencatat time-out.");
    }
  }, [clock, recordEvent, selectedSide]);

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

  // Undo last event
  const handleUndoLast = useCallback(async () => {
    const latestEvent = events[0];
    if (!latestEvent) return;

    try {
      await matchesApi.deleteEvent(matchId, latestEvent.id);
      undoLastEvent(latestEvent.id);
      toast.info("Event terakhir dibatalkan (undo).");
    } catch {
      toast.error("Gagal membatalkan event.");
    }
  }, [events, matchId, undoLastEvent]);

  // Period start / end handlers
  const handleStartPeriod = useCallback(() => {
    startPeriodMutation.mutate(currentPeriod, {
      onSuccess: () => {
        toast.success(`Babak ${currentPeriod} resmi dimulai.`);
      },
    });
  }, [currentPeriod, startPeriodMutation]);

  const handleEndPeriod = useCallback(() => {
    clock.pause();
    endPeriodMutation.mutate(currentPeriod, {
      onSuccess: () => {
        toast.success(`Babak ${currentPeriod} diakhiri.`);
        if (currentPeriod < (match?.periodCount ?? 4)) {
          setPeriod(currentPeriod + 1);
        }
      },
    });
  }, [clock, currentPeriod, endPeriodMutation, match?.periodCount, setPeriod]);

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
              onSelectPlayer={setSelectedPlayerId}
              onOpenSubModal={() => setSubModalSide("HOME")}
            />
          </div>

          {/* Column 2: Action Pad & Event Feed (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <ActionPad
              hasSelectedPlayer={Boolean(selectedPlayerId)}
              selectedAction={selectedAction}
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
              onSelectPlayer={setSelectedPlayerId}
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
              setSelectedPlayerId(null);
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
              onSelectPlayer={setSelectedPlayerId}
              onOpenSubModal={() => setSubModalSide(selectedSide)}
            />
          </div>

          {/* Action Pad */}
          <ActionPad
            hasSelectedPlayer={Boolean(selectedPlayerId)}
            selectedAction={selectedAction}
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
          />
        </div>
      </main>

      {/* Modals & Overlays */}
      {showAssistSheetForEventId && showAssistScorerSide && (
        <AssistSheet
          goalEventId={showAssistSheetForEventId}
          side={showAssistScorerSide}
          scorerPlayerId={selectedPlayerId}
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
