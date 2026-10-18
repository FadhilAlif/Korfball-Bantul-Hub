"use client";

import { Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

interface ShotZonePickerProps {
  open: boolean;
  onConfirm: (sector: number | null, distanceZone: number | null) => void;
  onCancel: () => void;
}

export function ShotZonePicker({ open, onConfirm, onCancel }: ShotZonePickerProps) {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const handleSave = () => {
    onConfirm(selectedSector, selectedZone);
  };

  const handleSkip = () => {
    onConfirm(null, null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Target size={18} className="text-primary" />
            <span>Pilih Lokasi & Jarak Tembakan</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Pitch Sektor (1 - 8) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sektor Lapangan (1 - 8)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  className={`py-2 rounded-xl border text-sm font-bold transition-all ${
                    selectedSector === s
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  Sektor {s}
                </button>
              ))}
            </div>
          </div>

          {/* Jarak dari Ring (1 - 6) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Zona Jarak Ring (1 = Sangat Dekat, 6 = Sangat Jauh)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { zone: 1, label: "1 (Dekat/Tap)" },
                { zone: 2, label: "2 (Under/Run)" },
                { zone: 3, label: "3 (Sedang)" },
                { zone: 4, label: "4 (Medium)" },
                { zone: 5, label: "5 (Jauh)" },
                { zone: 6, label: "6 (Boundary)" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.zone}
                  onClick={() => setSelectedZone(item.zone)}
                  className={`py-2 px-1 rounded-xl border text-xs font-medium transition-all ${
                    selectedZone === item.zone
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
              Lewati (Tanpa Zona)
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!selectedSector && !selectedZone}
              className="text-xs"
            >
              Simpan Zona
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
