"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, FormField, Input, Modal, Select } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useCreateSession, useUpdateSession } from "../hooks";
import { type SessionFormInput, type SessionFormOutput, sessionFormSchema } from "../schemas/session.schema";
import { DEFAULT_VENUE_PRESET, type SessionItem, type SessionType } from "../types";
import { SessionLocationPicker } from "./SessionLocationPicker";

const SESSION_TYPE_OPTIONS = [
  { value: "TRAINING", label: "Latihan Rutin" },
  { value: "SCRIMMAGE", label: "Scrimmage / Latihan Tanding" },
  { value: "MATCH", label: "Pertandingan Resmi" },
  { value: "OTHER", label: "Lainnya" },
];

function toWibDateAndTime(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

function getNextDayOfWeekWib(targetDay: number): string {
  const now = new Date();
  const wibStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const base = new Date(`${wibStr}T12:00:00+07:00`);
  const currentDay = base.getUTCDay();
  const diff = (targetDay - currentDay + 7) % 7;
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().slice(0, 10);
}

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: SessionItem | null;
}

export function SessionModal({ isOpen, onClose, session }: SessionModalProps) {
  const isEditing = !!session;
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const todayWib = toWibDateAndTime(new Date().toISOString()).date;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SessionFormInput, unknown, SessionFormOutput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      type: "TRAINING",
      title: "Latihan Rutin Selasa",
      date: todayWib,
      startTime: "18:00",
      endTime: "20:00",
      venue: DEFAULT_VENUE_PRESET.venue,
      latitude: DEFAULT_VENUE_PRESET.latitude,
      longitude: DEFAULT_VENUE_PRESET.longitude,
      radiusMeters: DEFAULT_VENUE_PRESET.radiusMeters,
      lateToleranceMinutes: 15,
      notes: "",
    },
  });

  const selectedType = watch("type") ?? "TRAINING";
  const watchedVenue = watch("venue") ?? "";
  const watchedLat = watch("latitude") ?? null;
  const watchedLng = watch("longitude") ?? null;
  const watchedRadius = Number(watch("radiusMeters") ?? DEFAULT_VENUE_PRESET.radiusMeters);

  useEffect(() => {
    if (isOpen) {
      if (session) {
        const start = toWibDateAndTime(session.startsAt);
        const end = toWibDateAndTime(session.endsAt);
        reset({
          type: session.type,
          title: session.title,
          date: start.date,
          startTime: start.time,
          endTime: end.time,
          venue: session.venue ?? "",
          latitude: session.latitude ?? null,
          longitude: session.longitude ?? null,
          radiusMeters: session.radiusMeters ?? DEFAULT_VENUE_PRESET.radiusMeters,
          lateToleranceMinutes: session.lateToleranceMinutes,
          notes: session.notes ?? "",
        });
      } else {
        reset({
          type: "TRAINING",
          title: "Latihan Rutin Selasa",
          date: getNextDayOfWeekWib(2),
          startTime: "18:00",
          endTime: "20:00",
          venue: DEFAULT_VENUE_PRESET.venue,
          latitude: DEFAULT_VENUE_PRESET.latitude,
          longitude: DEFAULT_VENUE_PRESET.longitude,
          radiusMeters: DEFAULT_VENUE_PRESET.radiusMeters,
          lateToleranceMinutes: 15,
          notes: "",
        });
      }
    }
  }, [isOpen, session, reset]);

  const applyPresetTuesday = () => {
    setValue("type", "TRAINING");
    setValue("title", "Latihan Rutin Selasa", { shouldValidate: true });
    setValue("date", getNextDayOfWeekWib(2), { shouldValidate: true });
    setValue("startTime", "18:00", { shouldValidate: true });
    setValue("endTime", "20:00", { shouldValidate: true });
    setValue("venue", DEFAULT_VENUE_PRESET.venue);
    setValue("latitude", DEFAULT_VENUE_PRESET.latitude);
    setValue("longitude", DEFAULT_VENUE_PRESET.longitude);
    setValue("radiusMeters", DEFAULT_VENUE_PRESET.radiusMeters);
    setValue("lateToleranceMinutes", 15);
  };

  const applyPresetSaturday = () => {
    setValue("type", "TRAINING");
    setValue("title", "Latihan Rutin Sabtu", { shouldValidate: true });
    setValue("date", getNextDayOfWeekWib(6), { shouldValidate: true });
    setValue("startTime", "19:00", { shouldValidate: true });
    setValue("endTime", "21:00", { shouldValidate: true });
    setValue("venue", DEFAULT_VENUE_PRESET.venue);
    setValue("latitude", DEFAULT_VENUE_PRESET.latitude);
    setValue("longitude", DEFAULT_VENUE_PRESET.longitude);
    setValue("radiusMeters", DEFAULT_VENUE_PRESET.radiusMeters);
    setValue("lateToleranceMinutes", 15);
  };

  const onSubmit = (data: SessionFormOutput) => {
    const payload = {
      type: data.type,
      title: data.title,
      startsAt: `${data.date}T${data.startTime}:00+07:00`,
      endsAt: `${data.date}T${data.endTime}:00+07:00`,
      venue: data.venue,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      radiusMeters: data.radiusMeters,
      lateToleranceMinutes: data.lateToleranceMinutes,
      notes: data.notes,
    };

    if (isEditing && session) {
      updateSession.mutate(
        { id: session.id, payload },
        {
          onSuccess: () => {
            toast.success("Sesi diperbarui", { description: data.title });
            onClose();
          },
          onError: (err) => setError("root", { message: getErrorMessage(err) }),
        },
      );
    } else {
      createSession.mutate(payload, {
        onSuccess: () => {
          toast.success("Sesi berhasil dibuat", { description: data.title });
          onClose();
        },
        onError: (err) => setError("root", { message: getErrorMessage(err) }),
      });
    }
  };

  const isSubmitting = isEditing ? updateSession.isPending : createSession.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Sesi Latihan" : "Buat Sesi Baru"} maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 pt-1">
        {!isEditing && (
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-border bg-muted/40">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground flex items-center gap-1">
              <Sparkles size={12} className="text-primary" />
              Preset Jadwal Rutin Korfball Bantul
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={applyPresetTuesday} className="justify-start">
                Selasa (18.00 – 20.00 WIB)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={applyPresetSaturday} className="justify-start">
                Sabtu (19.00 – 21.00 WIB)
              </Button>
            </div>
          </div>
        )}

        {errors.root && <Alert message={errors.root.message ?? "Terjadi kesalahan"} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Jenis Sesi" required error={errors.type?.message}>
            <Select
              value={selectedType}
              onChange={(v) => setValue("type", v as SessionType, { shouldValidate: true })}
              options={SESSION_TYPE_OPTIONS}
            />
          </FormField>

          <FormField
            label="Toleransi Terlambat (Menit)"
            htmlFor="session-tolerance"
            error={errors.lateToleranceMinutes?.message}
          >
            <Input
              id="session-tolerance"
              type="number"
              min={0}
              max={120}
              {...register("lateToleranceMinutes")}
              error={errors.lateToleranceMinutes?.message}
            />
          </FormField>
        </div>

        <FormField label="Judul Sesi" htmlFor="session-title" required error={errors.title?.message}>
          <Input
            id="session-title"
            {...register("title")}
            placeholder="Contoh: Latihan Rutin Selasa"
            error={errors.title?.message}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FormField label="Tanggal" htmlFor="session-date" required error={errors.date?.message}>
            <Input
              id="session-date"
              type="date"
              {...register("date")}
              iconLeft={<Calendar size={14} />}
              error={errors.date?.message}
            />
          </FormField>

          <FormField label="Jam Mulai (WIB)" htmlFor="session-start" required error={errors.startTime?.message}>
            <Input
              id="session-start"
              type="time"
              {...register("startTime")}
              iconLeft={<Clock size={14} />}
              error={errors.startTime?.message}
            />
          </FormField>

          <FormField label="Jam Selesai (WIB)" htmlFor="session-end" required error={errors.endTime?.message}>
            <Input
              id="session-end"
              type="time"
              {...register("endTime")}
              iconLeft={<Clock size={14} />}
              error={errors.endTime?.message}
            />
          </FormField>
        </div>

        <FormField label="Lokasi / Venue" htmlFor="session-venue" error={errors.venue?.message}>
          <Input
            id="session-venue"
            {...register("venue")}
            placeholder="WIFA SPORT CENTER"
            iconLeft={<MapPin size={15} />}
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

        <FormField label="Catatan (Opsional)" htmlFor="session-notes" error={errors.notes?.message}>
          <Input
            id="session-notes"
            {...register("notes")}
            placeholder="Materi latihan, fokus taktik, atau perlengkapan yang dibawa"
            error={errors.notes?.message}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Simpan Perubahan" : "Simpan Sesi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
