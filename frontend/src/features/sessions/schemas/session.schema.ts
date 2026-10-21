import { z } from "zod";
import { DEFAULT_VENUE_PRESET } from "../types";

const latitudeFieldSchema = z
  .number()
  .min(-90, "Latitude harus antara -90 dan 90")
  .max(90, "Latitude harus antara -90 dan 90")
  .nullable()
  .optional()
  .default(DEFAULT_VENUE_PRESET.latitude);

const longitudeFieldSchema = z
  .number()
  .min(-180, "Longitude harus antara -180 dan 180")
  .max(180, "Longitude harus antara -180 dan 180")
  .nullable()
  .optional()
  .default(DEFAULT_VENUE_PRESET.longitude);

const radiusMetersFieldSchema = z.coerce
  .number()
  .int()
  .min(20, "Radius minimal 20 meter")
  .max(2000, "Radius maksimal 2000 meter")
  .default(DEFAULT_VENUE_PRESET.radiusMeters);

function validateCoordinatePair(data: { latitude?: number | null; longitude?: number | null }) {
  const hasLat = data.latitude !== undefined && data.latitude !== null;
  const hasLon = data.longitude !== undefined && data.longitude !== null;
  return hasLat === hasLon;
}

export const sessionFormSchema = z
  .object({
    type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).default("TRAINING"),
    title: z.string().trim().min(3, "Judul sesi minimal 3 karakter").max(120, "Judul sesi maksimal 120 karakter"),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi (YYYY-MM-DD)"),
    startTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Jam mulai wajib format HH:MM"),
    endTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Jam selesai wajib format HH:MM"),
    venue: z
      .string()
      .trim()
      .max(200, "Venue maksimal 200 karakter")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    latitude: latitudeFieldSchema,
    longitude: longitudeFieldSchema,
    radiusMeters: radiusMetersFieldSchema,
    lateToleranceMinutes: z.coerce
      .number()
      .int()
      .min(0, "Toleransi terlambat minimal 0 menit")
      .max(120, "Toleransi terlambat maksimal 120 menit")
      .default(15),
    notes: z
      .string()
      .trim()
      .max(500, "Catatan maksimal 500 karakter")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine(
    (data) => {
      const start = new Date(`${data.date}T${data.startTime}:00+07:00`);
      const end = new Date(`${data.date}T${data.endTime}:00+07:00`);
      return end > start;
    },
    {
      message: "Jam selesai harus setelah jam mulai.",
      path: ["endTime"],
    },
  )
  .refine(validateCoordinatePair, {
    message: "Koordinat latitude dan longitude harus diisi berpasangan.",
    path: ["latitude"],
  });

export type SessionFormInput = z.input<typeof sessionFormSchema>;
export type SessionFormOutput = z.output<typeof sessionFormSchema>;

export const generateRoutineFormSchema = z
  .object({
    weeks: z.coerce.number().int().min(1, "Minimal 1 minggu").max(4, "Maksimal 4 minggu").default(4),
    venue: z
      .string()
      .trim()
      .min(2, "Venue wajib diisi")
      .max(200, "Venue maksimal 200 karakter")
      .default(DEFAULT_VENUE_PRESET.venue),
    latitude: latitudeFieldSchema,
    longitude: longitudeFieldSchema,
    radiusMeters: radiusMetersFieldSchema,
    lateToleranceMinutes: z.coerce.number().int().min(0).max(120).default(15),
  })
  .refine(validateCoordinatePair, {
    message: "Koordinat latitude dan longitude harus diisi berpasangan.",
    path: ["latitude"],
  });

export type GenerateRoutineFormInput = z.input<typeof generateRoutineFormSchema>;
export type GenerateRoutineFormOutput = z.output<typeof generateRoutineFormSchema>;
