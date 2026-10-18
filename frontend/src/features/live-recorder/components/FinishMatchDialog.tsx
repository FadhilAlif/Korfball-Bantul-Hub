"use client";

import { AlertTriangle, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface FinishMatchDialogProps {
  open: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  pendingCount: number;
  isFinishing: boolean;
  onConfirmFinish: () => void;
  onClose: () => void;
}

export function FinishMatchDialog({
  open,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  pendingCount,
  isFinishing,
  onConfirmFinish,
  onClose,
}: FinishMatchDialogProps) {
  const hasPending = pendingCount > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            <Trophy size={18} className="text-amber-500" />
            <span>Selesaikan Pertandingan?</span>
          </DialogTitle>
          <DialogDescription>
            Pertandingan yang diselesaikan akan berstatus <strong>FINISHED</strong> dan mengunci pencatatan statistik
            langsung.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-3">
          {/* Final Score Preview */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
            <div className="flex-1 text-right">
              <div className="font-bold text-sm text-foreground truncate">{homeTeamName}</div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">HOME</div>
            </div>
            <div className="font-black text-2xl tracking-tight text-foreground tabular-nums px-3 py-1 bg-card rounded-xl border border-border">
              {homeScore} - {awayScore}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm text-foreground truncate">{awayTeamName}</div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">AWAY</div>
            </div>
          </div>

          {/* Pending warning if any */}
          {hasPending && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                Terdapat <strong>{pendingCount} event</strong> yang belum selesai disinkronisasi ke server. Tunggu
                beberapa detik hingga proses sinkronisasi selesai sebelum menutup pertandingan.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isFinishing}>
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirmFinish}
            disabled={hasPending || isFinishing}
            className="gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>{isFinishing ? "Menyelesaikan..." : "Ya, Selesaikan Match"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
