"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Hash, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { TeamItem } from "@/features/teams/types";
import { Alert, Button, FormField, Input, Modal, Select } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useCreateAthlete, useUpdateAthlete } from "../hooks";
import { type AthleteFormInput, type AthleteFormOutput, athleteFormSchema } from "../schemas/athlete.schema";
import type { AthleteItem } from "../types";

interface AthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete?: AthleteItem | null;
  teams: TeamItem[];
}

export function AthleteModal({ isOpen, onClose, athlete, teams }: AthleteModalProps) {
  const isEditing = !!athlete;
  const createAthlete = useCreateAthlete();
  const updateAthlete = useUpdateAthlete();

  const defaultTeamId = teams.find((t) => t.isInternal)?.id ?? teams[0]?.id ?? 1;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AthleteFormInput, unknown, AthleteFormOutput>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
      teamId: defaultTeamId,
      fullName: "",
      nickname: "",
      sex: "FEMALE",
      jerseyNumber: "",
      birthDate: "",
      status: "ACTIVE",
      notes: "",
    },
  });

  const selectedTeamId = watch("teamId");
  const selectedSex = watch("sex");

  useEffect(() => {
    if (isOpen) {
      reset(
        athlete
          ? {
              teamId: athlete.teamId,
              fullName: athlete.fullName,
              nickname: athlete.nickname ?? "",
              sex: athlete.sex,
              jerseyNumber: athlete.jerseyNumber !== null ? String(athlete.jerseyNumber) : "",
              birthDate: athlete.birthDate ?? "",
              status: athlete.status,
              notes: athlete.notes ?? "",
            }
          : {
              teamId: defaultTeamId,
              fullName: "",
              nickname: "",
              sex: "FEMALE",
              jerseyNumber: "",
              birthDate: "",
              status: "ACTIVE",
              notes: "",
            },
      );
    }
  }, [isOpen, athlete, defaultTeamId, reset]);

  const onSubmit = (data: AthleteFormOutput) => {
    if (isEditing && athlete) {
      updateAthlete.mutate(
        { id: athlete.id, payload: data },
        {
          onSuccess: () => {
            toast.success("Profil atlet diperbarui", { description: data.fullName });
            onClose();
          },
          onError: (err) => setError("root", { message: getErrorMessage(err) }),
        },
      );
    } else {
      createAthlete.mutate(data, {
        onSuccess: () => {
          toast.success("Atlet berhasil ditambahkan", { description: data.fullName });
          onClose();
        },
        onError: (err) => setError("root", { message: getErrorMessage(err) }),
      });
    }
  };

  const isSubmitting = isEditing ? updateAthlete.isPending : createAthlete.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Profil Atlet" : "Tambah Atlet Baru"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">
          {isEditing
            ? "Perbarui identitas, nomor punggung, atau kategori atlet."
            : "Tambahkan data atlet untuk presensi latihan dan susunan pemain pertandingan."}
        </p>

        {errors.root && <Alert message={errors.root.message ?? "Terjadi kesalahan"} />}

        <FormField label="Tim" htmlFor="athlete-team" required error={errors.teamId?.message}>
          <Select
            searchable
            value={selectedTeamId ? String(selectedTeamId) : ""}
            onChange={(v) => setValue("teamId", Number(v), { shouldValidate: true })}
            options={teams.map((t) => ({
              value: String(t.id),
              label: `${t.name}${t.isInternal ? " (Internal)" : ""}`,
            }))}
            placeholder="Pilih tim…"
            searchPlaceholder="Cari tim…"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Nama Lengkap" htmlFor="athlete-fullname" required error={errors.fullName?.message}>
            <Input
              id="athlete-fullname"
              {...register("fullName")}
              placeholder="Contoh: Rukmi Sari"
              iconLeft={<User size={15} />}
              error={errors.fullName?.message}
            />
          </FormField>

          <FormField label="Nama Panggilan" htmlFor="athlete-nickname" error={errors.nickname?.message}>
            <Input
              id="athlete-nickname"
              {...register("nickname")}
              placeholder="Contoh: Rukmi"
              error={errors.nickname?.message}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Jenis Kelamin" required error={errors.sex?.message}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue("sex", "MALE", { shouldValidate: true })}
                className={`h-10 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSex === "MALE"
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Laki - Laki
              </button>
              <button
                type="button"
                onClick={() => setValue("sex", "FEMALE", { shouldValidate: true })}
                className={`h-10 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSex === "FEMALE"
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Perempuan
              </button>
            </div>
          </FormField>

          <FormField label="Nomor Punggung (0–99)" htmlFor="athlete-jersey" error={errors.jerseyNumber?.message}>
            <Input
              id="athlete-jersey"
              type="number"
              min={0}
              max={99}
              {...register("jerseyNumber")}
              placeholder="Contoh: 7"
              iconLeft={<Hash size={15} />}
              error={errors.jerseyNumber?.message}
            />
          </FormField>
        </div>

        <FormField label="Tanggal Lahir (Opsional)" htmlFor="athlete-birthdate" error={errors.birthDate?.message}>
          <Input
            id="athlete-birthdate"
            type="date"
            {...register("birthDate")}
            iconLeft={<Calendar size={15} />}
            error={errors.birthDate?.message}
          />
        </FormField>

        <FormField label="Catatan (Opsional)" htmlFor="athlete-notes" error={errors.notes?.message}>
          <Input
            id="athlete-notes"
            {...register("notes")}
            placeholder="Catatan posisi, kondisi fisik, atau keterangan tambahan"
            error={errors.notes?.message}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Simpan Perubahan" : "Simpan Atlet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
