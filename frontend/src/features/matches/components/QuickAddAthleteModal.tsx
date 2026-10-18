"use client";

import { Check, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateAthlete } from "@/features/athletes/hooks";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { Sex } from "../types";

interface QuickAddAthleteModalProps {
  open: boolean;
  teamId: number;
  teamName: string;
  onSuccess: (newAthleteId: number, jerseyNumber: number) => void;
  onClose: () => void;
}

export function QuickAddAthleteModal({ open, teamId, teamName, onSuccess, onClose }: QuickAddAthleteModalProps) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [sex, setSex] = useState<Sex>("MALE");
  const [jerseyNumber, setJerseyNumber] = useState<number>(0);

  const createAthleteMutation = useCreateAthlete();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Nama lengkap atlet wajib diisi.");
      return;
    }

    createAthleteMutation.mutate(
      {
        fullName: fullName.trim(),
        nickname: nickname.trim() || null,
        teamId,
        sex,
        jerseyNumber,
        birthDate: null,
        status: "ACTIVE",
        notes: null,
      },
      {
        onSuccess: (created) => {
          toast.success(`Atlet ${created.fullName} (#${created.jerseyNumber ?? 0}) berhasil ditambahkan.`);
          onSuccess(created.id, created.jerseyNumber ?? 0);
          setFullName("");
          setNickname("");
          setJerseyNumber(0);
          onClose();
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(errorResponse?.response?.data?.message || errorResponse?.message || "Gagal menambahkan atlet.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus size={18} className="text-primary" />
            <span>Tambah Atlet Cepat — {teamName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-athlete-name">Nama Lengkap *</Label>
            <Input
              id="quick-athlete-name"
              placeholder="Contoh: Budi Santoso"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-athlete-nick">Panggilan / Nickname</Label>
            <Input
              id="quick-athlete-nick"
              placeholder="Contoh: Budi"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-athlete-sex">Jenis Kelamin *</Label>
              <Select value={sex} onValueChange={(val) => setSex(val as Sex)}>
                <SelectTrigger id="quick-athlete-sex">
                  <SelectValue placeholder="Pilih L/P" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Putra (L)</SelectItem>
                  <SelectItem value="FEMALE">Putri (P)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-athlete-jersey">Nomor Jersey (0 - 99) *</Label>
              <Input
                id="quick-athlete-jersey"
                type="number"
                min={0}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number.parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={createAthleteMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={createAthleteMutation.isPending} className="gap-1.5">
              {createAthleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Simpan Atlet</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
