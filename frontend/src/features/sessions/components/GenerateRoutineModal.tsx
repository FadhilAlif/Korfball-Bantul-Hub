"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, Button, FormField, Input, Modal, Select } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useGenerateRoutineSessions } from "../hooks";
import {
  type GenerateRoutineFormInput,
  type GenerateRoutineFormOutput,
  generateRoutineFormSchema,
} from "../schemas/session.schema";
import { DEFAULT_VENUE_PRESET } from "../types";
import { SessionLocationPicker } from "./SessionLocationPicker";

const WEEKS_OPTIONS = [
  { value: "1", label: "1 Minggu ke depan (2 sesi)" },
  { value: "2", label: "2 Minggu ke depan (4 sesi)" },
  { value: "3", label: "3 Minggu ke depan (6 sesi)" },
  { value: "4", label: "4 Minggu ke depan (8 sesi)" },
];

interface GenerateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateRoutineModal({ isOpen, onClose }: GenerateRoutineModalProps) {
  const generateRoutine = useGenerateRoutineSessions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<GenerateRoutineFormInput, unknown, GenerateRoutineFormOutput>({
    resolver: zodResolver(generateRoutineFormSchema),
    defaultValues: {
      weeks: 4,
      venue: DEFAULT_VENUE_PRESET.venue,
      latitude: DEFAULT_VENUE_PRESET.latitude,
      longitude: DEFAULT_VENUE_PRESET.longitude,
      radiusMeters: DEFAULT_VENUE_PRESET.radiusMeters,
      lateToleranceMinutes: 15,
    },
  });

  const weeksValue = String(watch("weeks") ?? 4);
  const watchedVenue = watch("venue") ?? DEFAULT_VENUE_PRESET.venue;
  const watchedLat = watch("latitude") ?? null;
  const watchedLng = watch("longitude") ?? null;
  const watchedRadius = Number(watch("radiusMeters") ?? DEFAULT_VENUE_PRESET.radiusMeters);

  const onSubmit = (data: GenerateRoutineFormOutput) => {
    generateRoutine.mutate(data, {
      onSuccess: (res) => {
        toast.success("Jadwal rutin berhasil dibuat", { description: res.message });
        onClose();
      },
      onError: (err) => setError("root", { message: getErrorMessage(err) }),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Jadwal Latihan Rutin" maxWidth="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
        {errors.root && <Alert message={errors.root.message ?? "Terjadi kesalahan"} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: Konfigurasi Rutin */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CalendarCheck2 size={14} className="text-primary" />
                Jadwal Standar Korfball Bantul:
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                <li>Setiap Selasa: 18.00 – 20.00 WIB</li>
                <li>Setiap Sabtu: 19.00 – 21.00 WIB</li>
              </ul>
              <p className="text-muted-foreground pt-1 text-[11px] leading-relaxed">
                Sesi pada tanggal yang sudah memiliki jadwal akan dilewati secara otomatis (idempoten).
              </p>
            </div>

            <FormField label="Rentang Waktu Generate" required error={errors.weeks?.message}>
              <Select
                value={weeksValue}
                onChange={(v) => setValue("weeks", Number(v), { shouldValidate: true })}
                options={WEEKS_OPTIONS}
              />
            </FormField>

            <FormField
              label="Toleransi Terlambat (Menit)"
              htmlFor="routine-tolerance"
              error={errors.lateToleranceMinutes?.message}
            >
              <Input
                id="routine-tolerance"
                type="number"
                min={0}
                max={120}
                {...register("lateToleranceMinutes")}
                error={errors.lateToleranceMinutes?.message}
              />
            </FormField>
          </div>

          {/* Kolom Kanan: Lokasi & Geofence GPS */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <FormField label="Lokasi / Venue Default" htmlFor="routine-venue" required error={errors.venue?.message}>
              <Input
                id="routine-venue"
                {...register("venue")}
                iconLeft={<MapPin size={15} />}
                placeholder="WIFA SPORT CENTER"
                error={errors.venue?.message}
              />
            </FormField>

            <SessionLocationPicker
              venue={watchedVenue}
              latitude={watchedLat}
              longitude={watchedLng}
              radiusMeters={watchedRadius}
              onChangeVenue={(v) => setValue("venue", v, { shouldValidate: true })}
              onChangeCoordinates={({ latitude, longitude }) => {
                setValue("latitude", latitude, { shouldValidate: true });
                setValue("longitude", longitude, { shouldValidate: true });
              }}
              onChangeRadius={(r) => setValue("radiusMeters", r, { shouldValidate: true })}
              errorMessage={errors.latitude?.message || errors.longitude?.message || errors.radiusMeters?.message}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-4 px-5 sm:px-6 py-3 bg-card/95 backdrop-blur-xs border-t border-border flex items-center justify-end gap-2.5 z-10 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={generateRoutine.isPending}>
            Generate Jadwal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
