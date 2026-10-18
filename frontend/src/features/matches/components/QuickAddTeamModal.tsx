"use client";

import { Building2, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateTeam } from "@/features/teams/hooks";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface QuickAddTeamModalProps {
  open: boolean;
  onSuccess: (teamId: number, teamName: string) => void;
  onClose: () => void;
}

export function QuickAddTeamModal({ open, onSuccess, onClose }: QuickAddTeamModalProps) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const createTeamMutation = useCreateTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama tim wajib diisi.");
      return;
    }

    createTeamMutation.mutate(
      {
        name: name.trim(),
        shortName: shortName.trim() || null,
        region: contactInfo.trim() || null,
        isInternal: false,
        color: "#3B82F6",
      },
      {
        onSuccess: (createdTeam) => {
          toast.success(`Tim ${createdTeam.name} berhasil ditambahkan.`);
          onSuccess(createdTeam.id, createdTeam.name);
          setName("");
          setShortName("");
          setCoachName("");
          setContactInfo("");
          onClose();
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(errorResponse?.response?.data?.message || errorResponse?.message || "Gagal menambahkan tim.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Building2 size={18} className="text-primary" />
            <span>Tambah Tim Lawan Cepat</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-team-name">Nama Tim *</Label>
            <Input
              id="quick-team-name"
              placeholder="Contoh: Kab. Tangerang Selatan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-team-short">Nama Singkat / Singkatan</Label>
            <Input
              id="quick-team-short"
              placeholder="Contoh: TANGSEL"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-team-coach">Nama Pelatih (Opsional)</Label>
            <Input
              id="quick-team-coach"
              placeholder="Contoh: Coach Hendra"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-team-contact">Kontak / Kota (Opsional)</Label>
            <Input
              id="quick-team-contact"
              placeholder="Contoh: Tangerang Selatan, Banten"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={createTeamMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={createTeamMutation.isPending} className="gap-1.5">
              {createTeamMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Simpan Tim</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
