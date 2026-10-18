"use client";

import { ArrowLeftRight, Check, ShieldAlert } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { MatchPlayerItem, MatchSide } from "../../matches/types";

interface PlayerGridProps {
  side: MatchSide;
  teamName: string;
  teamColor: string;
  players: MatchPlayerItem[];
  selectedPlayerId: number | null;
  onSelectPlayer: (id: number) => void;
  onOpenSubModal?: () => void;
  className?: string;
}

export const PlayerGrid = memo(function PlayerGrid({
  side,
  teamName,
  teamColor,
  players,
  selectedPlayerId,
  onSelectPlayer,
  onOpenSubModal,
  className,
}: PlayerGridProps) {
  const onCourtPlayers = players.filter((p) => p.isOnCourt && !p.hasRedCard);
  const benchPlayers = players.filter((p) => !p.isOnCourt && !p.hasRedCard);
  const disqualifiedPlayers = players.filter((p) => p.hasRedCard);

  const maleOnCourtCount = onCourtPlayers.filter((p) => p.sex === "MALE").length;
  const femaleOnCourtCount = onCourtPlayers.filter((p) => p.sex === "FEMALE").length;

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {/* Team header banner */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: teamColor || (side === "HOME" ? "#FACC15" : "#3B82F6") }}
          />
          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{teamName}</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground uppercase">
            {side}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
            {maleOnCourtCount}L / {femaleOnCourtCount}P
          </Badge>
          {onOpenSubModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSubModal}
              className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftRight size={11} />
              <span>Sub</span>
            </Button>
          )}
        </div>
      </div>

      {/* On-Court players list */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          On Court ({onCourtPlayers.length})
        </span>

        <div className="grid grid-cols-2 gap-1.5">
          {onCourtPlayers.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            return (
              <button
                type="button"
                key={player.id}
                onClick={() => onSelectPlayer(player.id)}
                className={cn(
                  "relative flex items-center gap-2 p-2 rounded-xl text-left border transition-all select-none min-h-[50px]",
                  "hover:border-primary/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "bg-primary/15 border-primary shadow-xs ring-1 ring-primary"
                    : "bg-card border-border hover:bg-accent/40",
                )}
              >
                {/* Jersey number */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border",
                  )}
                >
                  #{player.jerseyNumber}
                </div>

                {/* Player info */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm text-foreground truncate">
                    {player.athleteNickname || player.athleteName}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">{player.sex === "MALE" ? "L" : "P"}</span>
                    {player.isStarter && <span>• Starter</span>}
                  </div>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bench players section */}
      {benchPlayers.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Cadangan ({benchPlayers.length})
          </span>
          <div className="grid grid-cols-3 gap-1">
            {benchPlayers.map((player) => {
              const isSelected = selectedPlayerId === player.id;
              return (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => onSelectPlayer(player.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left opacity-75 hover:opacity-100 transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary opacity-100 ring-1 ring-primary"
                      : "bg-card/50 border-border/70",
                  )}
                >
                  <span className="font-mono font-bold text-xs text-foreground/90 shrink-0">
                    #{player.jerseyNumber}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {player.athleteNickname || player.athleteName}
                  </span>
                  <span className="text-[9px] text-muted-foreground/70 ml-auto">
                    {player.sex === "MALE" ? "L" : "P"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Disqualified players */}
      {disqualifiedPlayers.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[10px] font-semibold tracking-wider text-destructive uppercase flex items-center gap-1">
            <ShieldAlert size={12} />
            Diskualifikasi ({disqualifiedPlayers.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {disqualifiedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-[11px] line-through opacity-70"
              >
                <span className="font-bold">#{player.jerseyNumber}</span>
                <span>{player.athleteNickname || player.athleteName}</span>
                <span className="text-[9px] bg-destructive text-destructive-foreground px-1 rounded-xs ml-1 no-underline font-semibold">
                  RC
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
