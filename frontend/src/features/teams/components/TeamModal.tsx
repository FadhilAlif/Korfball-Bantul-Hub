"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Palette, Shield, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, FormField, Input, Modal } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useCreateTeam, useUpdateTeam } from "../hooks";
import { type TeamFormInput, type TeamFormOutput, teamFormSchema } from "../schemas/team.schema";
import type { TeamItem } from "../types";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: TeamItem | null;
}

export function TeamModal({ isOpen, onClose, team }: TeamModalProps) {
  const isEditing = !!team;
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TeamFormInput, unknown, TeamFormOutput>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      region: "",
      isInternal: false,
      color: "#3B82F6",
    },
  });

  const colorValue = watch("color") || "#3B82F6";
  const isInternalValue = watch("isInternal") ?? false;

  useEffect(() => {
    if (isOpen) {
      reset(
        team
          ? {
              name: team.name,
              shortName: team.shortName ?? "",
              region: team.region ?? "",
              isInternal: team.isInternal,
              color: team.color || (team.isInternal ? "#FACC15" : "#3B82F6"),
            }
          : {
              name: "",
              shortName: "",
              region: "",
              isInternal: false,
              color: "#3B82F6",
            },
      );
    }
  }, [isOpen, team, reset]);

  const onSubmit = (data: TeamFormOutput) => {
    if (isEditing && team) {
      updateTeam.mutate(
        { id: team.id, payload: data },
        {
          onSuccess: () => {
            toast.success("Tim diperbarui", { description: data.name });
            onClose();
          },
          onError: (err) => setError("root", { message: getErrorMessage(err) }),
        },
      );
    } else {
      createTeam.mutate(data, {
        onSuccess: () => {
          toast.success("Tim berhasil ditambahkan", { description: data.name });
          onClose();
        },
        onError: (err) => setError("root", { message: getErrorMessage(err) }),
      });
    }
  };

  const isSubmitting = isEditing ? updateTeam.isPending : createTeam.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Tim" : "Tambah Tim Baru"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">
          {isEditing
            ? "Perbarui informasi identitas tim dan warna jersey."
            : "Tambahkan tim internal klub atau tim lawan untuk pencatatan statistik pertandingan."}
        </p>

        {errors.root && <Alert message={errors.root.message ?? "Terjadi kesalahan"} />}

        <FormField label="Nama Tim" htmlFor="team-name" required error={errors.name?.message}>
          <Input
            id="team-name"
            {...register("name")}
            placeholder="Contoh: Kab. Klaten"
            iconLeft={<UsersRound size={15} />}
            error={errors.name?.message}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Singkatan (Kode)" htmlFor="team-short" error={errors.shortName?.message}>
            <Input
              id="team-short"
              {...register("shortName")}
              placeholder="Contoh: KLATEN"
              iconLeft={<Shield size={15} />}
              error={errors.shortName?.message}
            />
          </FormField>

          <FormField label="Warna Identitas (#Hex)" htmlFor="team-color" required error={errors.color?.message}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pilih warna tim"
                value={/^#[0-9A-Fa-f]{6}$/.test(colorValue) ? colorValue : "#3B82F6"}
                onChange={(e) => setValue("color", e.target.value.toUpperCase(), { shouldValidate: true })}
                className="h-10 w-11 rounded-lg border border-input bg-background p-1 cursor-pointer shrink-0"
              />
              <Input
                id="team-color"
                {...register("color")}
                placeholder="#3B82F6"
                iconLeft={<Palette size={15} />}
                error={errors.color?.message}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Daerah / Kota Asal" htmlFor="team-region" error={errors.region?.message}>
          <Input
            id="team-region"
            {...register("region")}
            placeholder="Contoh: Kab. Klaten, Jawa Tengah"
            iconLeft={<MapPin size={15} />}
            error={errors.region?.message}
          />
        </FormField>

        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isInternalValue}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue("isInternal", checked);
              if (checked && colorValue === "#3B82F6") {
                setValue("color", "#FACC15");
              }
            }}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <div className="text-xs">
            <div className="font-semibold text-foreground">Tim Internal Klub (Korfball Bantul)</div>
            <div className="text-muted-foreground">
              Aktifkan jika tim ini adalah skuad internal yang memiliki jadwal latihan dan presensi rutin.
            </div>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Simpan Perubahan" : "Simpan Tim"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
