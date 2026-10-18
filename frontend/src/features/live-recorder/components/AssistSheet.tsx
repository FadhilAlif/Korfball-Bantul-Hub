"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import type { MatchPlayerItem, MatchSide } from "../../matches/types";

interface AssistSheetProps {
  goalEventId: string;
  side: MatchSide;
  scorerPlayerId?: number | null;
  players: MatchPlayerItem[];
  onSelectAssist: (assistPlayerId: number) => void;
  onDismiss: () => void;
}

export function AssistSheet({
  goalEventId,
  side,
  scorerPlayerId,
  players,
  onSelectAssist,
  onDismiss,
}: AssistSheetProps) {
  const [secondsLeft, setSecondsLeft] = useState(4);

  // Eligible assist teammates: on-court, same side, not the scorer, no red card
  const eligibleTeammates = players.filter(
    (p) => p.side === side && p.isOnCourt && !p.hasRedCard && p.id !== scorerPlayerId,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="max-w-xl mx-auto flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
            <Sparkles size={16} className="text-violet-500" />
            <span>Gol Tercatat! Siapa pemberi Assist?</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">Auto-close: {secondsLeft}s</span>
            <Button size="icon" variant="ghost" onClick={onDismiss} className="h-6 w-6">
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Teammates grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {eligibleTeammates.map((teammate) => (
            <button
              type="button"
              key={teammate.id}
              onClick={() => onSelectAssist(teammate.id)}
              className="flex items-center gap-2 p-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 text-left transition-all"
            >
              <span className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                #{teammate.jerseyNumber}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-foreground truncate">
                  {teammate.athleteNickname || teammate.athleteName}
                </div>
                <div className="text-[10px] text-muted-foreground">{teammate.sex === "MALE" ? "L" : "P"}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Dismiss / Skip button */}
        <Button variant="outline" size="sm" onClick={onDismiss} className="w-full text-xs">
          Tanpa Assist / Lewati ({secondsLeft}s)
        </Button>
      </div>
    </div>
  );
}
