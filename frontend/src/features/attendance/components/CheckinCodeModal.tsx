"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRegenerateCheckinCode } from "@/features/sessions/hooks";
import { Button, Modal } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";

interface CheckinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  sessionTitle: string;
  checkinCode: string;
  canRegenerate: boolean;
}

export function CheckinCodeModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  checkinCode,
  canRegenerate,
}: CheckinCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const regenerateMutation = useRegenerateCheckinCode();

  const handleCopy = () => {
    navigator.clipboard
      .writeText(checkinCode)
      .then(() => {
        setCopied(true);
        toast.success("Kode check-in disalin ke clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate(sessionId, {
      onSuccess: (res) => {
        toast.success("Kode check-in diperbarui", { description: `Kode baru: ${res.checkinCode}` });
      },
      onError: (err) => {
        toast.error("Gagal memperbarui kode check-in", { description: getErrorMessage(err) });
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Kode Self Check-In — ${sessionTitle}`} maxWidth="lg">
      <div className="flex flex-col items-center text-center gap-5 py-4">
        <p className="text-sm text-muted-foreground max-w-md">
          Tunjukkan kode 6 karakter di bawah ini kepada atlet agar mereka dapat melakukan check-in mandiri melalui HP
          masing-masing.
        </p>

        <div className="w-full py-8 px-4 rounded-2xl border-2 border-primary/30 bg-primary/6 flex items-center justify-center">
          <span className="font-mono font-bold text-4xl sm:text-6xl tracking-[0.28em] text-primary select-all">
            {checkinCode}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            {copied ? "Tersalin" : "Salin Kode"}
          </Button>

          {canRegenerate && (
            <Button
              type="button"
              variant="secondary"
              isLoading={regenerateMutation.isPending}
              onClick={handleRegenerate}
            >
              <RefreshCw size={15} />
              Acak Ulang Kode
            </Button>
          )}

          <Button type="button" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
