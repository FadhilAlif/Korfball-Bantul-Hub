"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Button, Modal } from "@/shared/components/ui";

interface FinalizeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionTitle: string;
  unrecordedCount: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  isLoading: boolean;
}

export function FinalizeSessionModal({
  isOpen,
  onClose,
  onConfirm,
  sessionTitle,
  unrecordedCount,
  presentCount,
  lateCount,
  excusedCount,
  absentCount,
  isLoading,
}: FinalizeSessionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Finalisasi Sesi — ${sessionTitle}`} maxWidth="md">
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-sm text-muted-foreground">
          Setelah difinalisasi, status sesi berubah menjadi <strong>Selesai (COMPLETED)</strong> dan atlet tidak dapat
          lagi melakukan check-in mandiri pada sesi ini.
        </p>

        <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl border border-border bg-muted/40">
          <div>
            <div className="text-lg font-bold text-success">{presentCount}</div>
            <div className="text-[11px] text-muted-foreground">Hadir</div>
          </div>
          <div>
            <div className="text-lg font-bold text-warning">{lateCount}</div>
            <div className="text-[11px] text-muted-foreground">Terlambat</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{excusedCount}</div>
            <div className="text-[11px] text-muted-foreground">Izin</div>
          </div>
          <div>
            <div className="text-lg font-bold text-destructive">{absentCount + unrecordedCount}</div>
            <div className="text-[11px] text-muted-foreground">Total Absen</div>
          </div>
        </div>

        {unrecordedCount > 0 ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/10 border border-warning/25 text-warning text-xs">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              Terdapat <strong>{unrecordedCount} atlet aktif</strong> yang belum memiliki catatan kehadiran dan akan
              otomatis ditandai sebagai <strong>ABSENT (Alpha)</strong>.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/25 text-success text-xs">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Seluruh atlet aktif pada sesi ini sudah memiliki status kehadiran.</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" isLoading={isLoading} onClick={onConfirm}>
            Konfirmasi & Finalisasi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
