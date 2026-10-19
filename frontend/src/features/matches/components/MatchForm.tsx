"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTeams } from "@/features/teams/hooks";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useCreateMatch, useUpdateMatch } from "../hooks/useMatches";
import { fromWibDateTimeInput, toWibDateTimeInput } from "@/shared/lib/format-date";
import { type MatchFormInput, type MatchFormOutput, createMatchFormSchema } from "../schemas/match.schema";
import type { MatchDetail } from "../types";
import { QuickAddTeamModal } from "./QuickAddTeamModal";

interface MatchFormProps {
  initialData?: MatchDetail;
  isEdit?: boolean;
}

export function MatchForm({ initialData, isEdit = false }: MatchFormProps) {
  const router = useRouter();
  const [showQuickAddTeam, setShowQuickAddTeam] = useState(false);

  // Fetch teams for selector
  const { data: teamsData, refetch: refetchTeams } = useTeams({ limit: 100 });
  const teams = teamsData?.data ?? [];

  // Default internal team (Korfball Bantul)
  const internalTeam = teams.find((t) => t.isInternal);

  const defaultScheduled = initialData?.scheduledAt
    ? toWibDateTimeInput(initialData.scheduledAt)
    : toWibDateTimeInput(Date.now() + 3600 * 1000);

  const form = useForm<MatchFormInput, unknown, MatchFormOutput>({
    resolver: zodResolver(createMatchFormSchema),
    defaultValues: {
      type: initialData?.type ?? "SCRIMMAGE",
      format: initialData?.format ?? "K8",
      homeTeamId: initialData?.homeTeamId ?? internalTeam?.id ?? 1,
      awayTeamId: initialData?.awayTeamId ?? 2,
      homeLabel: initialData?.homeLabel ?? "",
      awayLabel: initialData?.awayLabel ?? "",
      homeColor: initialData?.homeColor ?? "#FACC15",
      awayColor: initialData?.awayColor ?? "#3B82F6",
      competition: initialData?.competition ?? "",
      gameNumber: initialData?.gameNumber ?? "",
      venue: initialData?.venue ?? "GOR Dwi Windu Bantul",
      scheduledAt: defaultScheduled,
      periodCount: initialData?.periodCount ?? 2,
      periodDurationMinutes: initialData?.periodDurationMinutes ?? 25,
      trackShotZone: initialData?.trackShotZone ?? false,
      referees: initialData?.referees ?? "",
      juryChair: initialData?.juryChair ?? "",
      juryMembers: initialData?.juryMembers ?? "",
      homeHeadCoach: initialData?.homeHeadCoach ?? "",
      homeAssistantCoach: initialData?.homeAssistantCoach ?? "",
      awayHeadCoach: initialData?.awayHeadCoach ?? "",
      awayAssistantCoach: initialData?.awayAssistantCoach ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  // Sync internal team ID once teams load if creating new match
  useEffect(() => {
    if (!isEdit && internalTeam && !form.getValues("homeTeamId")) {
      form.setValue("homeTeamId", internalTeam.id);
    }
  }, [internalTeam, isEdit, form]);

  const createMatchMutation = useCreateMatch();
  const updateMatchMutation = useUpdateMatch(initialData?.id ?? 0);

  const formatValue = form.watch("format");

  // Adjust default period duration when format changes
  useEffect(() => {
    if (!isEdit) {
      if (formatValue === "K8") {
        form.setValue("periodCount", 4);
        form.setValue("periodDurationMinutes", 10);
      } else {
        form.setValue("periodCount", 2);
        form.setValue("periodDurationMinutes", 10);
      }
    }
  }, [formatValue, isEdit, form]);

  const onSubmit = (values: MatchFormOutput) => {
    const payload = {
      ...values,
      scheduledAt: fromWibDateTimeInput(values.scheduledAt),
    };

    if (isEdit && initialData) {
      updateMatchMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Pertandingan berhasil diperbarui.");
          router.push(`/matches/${initialData.id}`);
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(
            errorResponse?.response?.data?.message || errorResponse?.message || "Gagal memperbarui pertandingan.",
          );
        },
      });
    } else {
      createMatchMutation.mutate(payload, {
        onSuccess: (res) => {
          toast.success("Pertandingan berhasil dibuat.");
          router.push(`/matches/${res.data.id}`);
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(
            errorResponse?.response?.data?.message || errorResponse?.message || "Gagal membuat pertandingan.",
          );
        },
      });
    }
  };

  const isSubmitting = createMatchMutation.isPending || updateMatchMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Card 1: Pengaturan Dasar & Tim */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Trophy size={18} className="text-primary" />
          <span>Pengaturan Pertandingan & Format</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tipe Pertandingan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-type">Tipe Match *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(val) => form.setValue("type", val as "SCRIMMAGE" | "OFFICIAL" | "FRIENDLY")}
            >
              <SelectTrigger id="match-type">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCRIMMAGE">Internal Scrimmage</SelectItem>
                <SelectItem value="OFFICIAL">Official Tournament</SelectItem>
                <SelectItem value="FRIENDLY">Friendly Match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format Pertandingan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-format">Format Korfball *</Label>
            <Select value={form.watch("format")} onValueChange={(val) => form.setValue("format", val as "K8" | "K4")}>
              <SelectTrigger id="match-format">
                <SelectValue placeholder="Pilih Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="K8">Korfball 8 (K8 — 4L & 4P)</SelectItem>
                <SelectItem value="K4">Korfball 4 (K4 — 2L & 2P)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kompetisi / Turnamen */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-competition">Turnamen / Seri</Label>
            <Input
              id="match-competition"
              placeholder="Contoh: Piala Korfball Bantul 2026"
              {...form.register("competition")}
            />
          </div>
        </div>

        {/* Tim Home & Away Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Tim Home */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Tim Home</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Warna:</span>
                <input
                  type="color"
                  value={form.watch("homeColor")}
                  onChange={(e) => form.setValue("homeColor", e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-border p-0"
                />
              </div>
            </div>

            <Select
              value={String(form.watch("homeTeamId"))}
              onValueChange={(val) => form.setValue("homeTeamId", Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tim Home" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} {t.isInternal ? "(Internal)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.homeTeamId && (
              <span className="text-xs text-destructive">{form.formState.errors.homeTeamId.message}</span>
            )}
          </div>

          {/* Tim Away */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Tim Away</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowQuickAddTeam(true)}
                  className="h-6 text-[11px] gap-1 px-1.5 text-primary"
                >
                  <Plus size={12} />
                  <span>Buat Tim Baru</span>
                </Button>
                <input
                  type="color"
                  value={form.watch("awayColor")}
                  onChange={(e) => form.setValue("awayColor", e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-border p-0"
                />
              </div>
            </div>

            <Select
              value={String(form.watch("awayTeamId"))}
              onValueChange={(val) => form.setValue("awayTeamId", Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tim Away" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} {t.isInternal ? "(Internal)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.awayTeamId && (
              <span className="text-xs text-destructive">{form.formState.errors.awayTeamId.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Jadwal, Lokasi, Durasi Babak */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-base text-foreground">Jadwal & Waktu Pertandingan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-scheduled">Waktu Mulai Pertandingan (WIB) *</Label>
            <Input id="match-scheduled" type="datetime-local" {...form.register("scheduledAt")} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-venue">Lokasi / Venue</Label>
            <Input id="match-venue" placeholder="Contoh: GOR Dwi Windu Bantul" {...form.register("venue")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-period-count">Jumlah Babak (1 - 4)</Label>
            <Input
              id="match-period-count"
              type="number"
              min={1}
              max={4}
              {...form.register("periodCount", { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-duration">Durasi Per Babak (Menit)</Label>
            <Input
              id="match-duration"
              type="number"
              min={1}
              max={60}
              {...form.register("periodDurationMinutes", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Track shot zone toggle */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="track-shot-zone"
            checked={form.watch("trackShotZone")}
            onCheckedChange={(checked) => form.setValue("trackShotZone", Boolean(checked))}
          />
          <Label htmlFor="track-shot-zone" className="text-xs font-medium cursor-pointer">
            Aktifkan Pencatatan Sektor Lapangan (1–8) & Jarak Ring (1–6) saat tembakan
          </Label>
        </div>
      </div>

      {/* Card 3: Perangkat Pertandingan & Pelatih */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-base text-foreground">Perangkat Pertandingan & Pelatih (Opsional)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-referees">Wasit (Referees)</Label>
            <Input id="match-referees" placeholder="Nama wasit pertandingan" {...form.register("referees")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-jury-chair">Ketua Juri (Jury Chair)</Label>
            <Input id="match-jury-chair" placeholder="Nama ketua juri meja" {...form.register("juryChair")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-jury-members">Anggota Juri / Timekeeper</Label>
            <Input id="match-jury-members" placeholder="Nama pencatat waktu & skor" {...form.register("juryMembers")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-home-coach">Pelatih Tim Home</Label>
            <Input id="match-home-coach" placeholder="Head coach tim home" {...form.register("homeHeadCoach")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-away-coach">Pelatih Tim Away</Label>
            <Input id="match-away-coach" placeholder="Head coach tim away" {...form.register("awayHeadCoach")} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
          <Label htmlFor="match-notes">Catatan Pertandingan</Label>
          <textarea
            id="match-notes"
            placeholder="Catatan khusus, kondisi lapangan, dll."
            rows={2}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("notes")}
          />
        </div>
      </div>

      {/* Submit button bar */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          <span>{isEdit ? "Simpan Perubahan" : "Buat Pertandingan"}</span>
        </Button>
      </div>

      {/* Quick Add Team Modal */}
      {showQuickAddTeam && (
        <QuickAddTeamModal
          open={showQuickAddTeam}
          onSuccess={(teamId) => {
            void refetchTeams();
            form.setValue("awayTeamId", teamId);
          }}
          onClose={() => setShowQuickAddTeam(false)}
        />
      )}
    </form>
  );
}
