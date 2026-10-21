"use client";

import { ArrowLeftRight, Check, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import type { MatchPlayerItem, MatchSide } from "../../matches/types";

interface SubstitutionModalProps {
  open: boolean;
  side: MatchSide;
  teamName: string;
  players: MatchPlayerItem[];
  onConfirm: (outPlayerId: number, inPlayerId: number) => void;
  onClose: () => void;
}

export function SubstitutionModal({ open, side, teamName, players, onConfirm, onClose }: SubstitutionModalProps) {
  const [selectedOutId, setSelectedOutId] = useState<number | null>(null);
  const [selectedInId, setSelectedInId] = useState<number | null>(null);

  // Filter players for this side
  const teamPlayers = players.filter((p) => p.side === side && !p.hasRedCard);
  const courtPlayers = teamPlayers.filter((p) => p.isOnCourt);

  const selectedOutPlayer = courtPlayers.find((p) => p.id === selectedOutId);

  // Eligible bench players: same gender as out player, and not currently on court
  const benchPlayers = teamPlayers.filter(
    (p) => !p.isOnCourt && (!selectedOutPlayer || p.sex === selectedOutPlayer.sex),
  );

  const handleSub = () => {
    if (selectedOutId && selectedInId) {
      onConfirm(selectedOutId, selectedInId);
      setSelectedOutId(null);
      setSelectedInId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight size={18} className="text-primary" />
            <span>Substitusi Pemain — {teamName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Step 1: Pemain Keluar (On Court) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserMinus size={13} className="text-rose-500" />
              1. Pilih Pemain Keluar (On-Court)
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {courtPlayers.map((p) => {
                const isSelected = selectedOutId === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      setSelectedOutId(p.id);
                      setSelectedInId(null); // Reset in player to ensure sex match
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 font-medium"
                        : "bg-card border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="w-7 h-7 rounded-lg bg-muted text-foreground font-bold text-xs flex items-center justify-center shrink-0">
                      #{p.jerseyNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{p.athleteNickname || p.athleteName}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        {p.sex === "MALE" ? "Laki - Laki" : "Perempuan"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Pemain Masuk (Bench) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserPlus size={13} className="text-emerald-500" />
              2. Pilih Pemain Masuk (Cadangan{" "}
              {selectedOutPlayer ? `— ${selectedOutPlayer.sex === "MALE" ? "Laki - Laki" : "Perempuan"}` : ""})
            </span>
            {benchPlayers.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 rounded-xl border border-dashed border-border text-center">
                {selectedOutPlayer
                  ? `Tidak ada pemain cadangan dengan jenis kelamin ${selectedOutPlayer.sex === "MALE" ? "Laki - Laki" : "Perempuan"}.`
                  : "Pilih pemain keluar terlebih dahulu."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {benchPlayers.map((p) => {
                  const isSelected = selectedInId === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedInId(p.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border text-left transition-all",
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500 font-medium"
                          : "bg-card border-border hover:bg-muted/50",
                      )}
                    >
                      <span className="w-7 h-7 rounded-lg bg-muted text-foreground font-bold text-xs flex items-center justify-center shrink-0">
                        #{p.jerseyNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate">{p.athleteNickname || p.athleteName}</div>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          {p.sex === "MALE" ? "Laki - Laki" : "Perempuan"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSub}
              disabled={!selectedOutId || !selectedInId}
              className="text-xs gap-1"
            >
              <Check size={14} />
              <span>Simpan Substitusi</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
