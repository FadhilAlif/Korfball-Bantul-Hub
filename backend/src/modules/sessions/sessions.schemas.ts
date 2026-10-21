import { z } from "zod";

const isoDateStringSchema = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: "Format tanggal tidak valid (gunakan ISO 8601).",
});

export const DEFAULT_VENUE_PRESET = {
  venue: "WIFA SPORT CENTER",
  latitude: -7.900181586573576,
  longitude: 110.32812616243315,
  radiusMeters: 100,
} as const;

const latitudeSchema = z
  .number()
  .min(-90, "Latitude harus berada di antara -90 dan 90.")
  .max(90, "Latitude harus berada di antara -90 dan 90.")
  .optional()
  .nullable();

const longitudeSchema = z
  .number()
  .min(-180, "Longitude harus berada di antara -180 dan 180.")
  .max(180, "Longitude harus berada di antara -180 dan 180.")
  .optional()
  .nullable();

const radiusMetersSchema = z
  .number()
  .int()
  .min(20, "Radius harus antara 20 hingga 2000 meter.")
  .max(2000, "Radius harus antara 20 hingga 2000 meter.");

function hasValidCoordPair(data: {
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}): boolean {
  const hasLat = data.latitude !== undefined && data.latitude !== null;
  const hasLon = data.longitude !== undefined && data.longitude !== null;
  return hasLat === hasLon;
}

export const createSessionSchema = z
  .object({
    teamId: z.number().int().positive().optional(),
    type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).optional().default("TRAINING"),
    title: z.string().trim().min(3, "Judul sesi minimal 3 karakter").max(120, "Judul sesi maksimal 120 karakter"),
    startsAt: isoDateStringSchema,
    endsAt: isoDateStringSchema,
    venue: z.string().trim().max(200, "Venue maksimal 200 karakter").optional().nullable(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    radiusMeters: radiusMetersSchema.optional().default(100),
    lateToleranceMinutes: z
      .number()
      .int()
      .min(0, "Toleransi terlambat minimal 0 menit")
      .max(120, "Toleransi terlambat maksimal 120 menit")
      .optional()
      .default(15),
    notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["endsAt"],
  })
  .refine(hasValidCoordPair, {
    message: "Koordinat latitude dan longitude harus diisi lengkap.",
    path: ["latitude"],
  });

export const updateSessionSchema = z
  .object({
    type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).optional(),
    title: z
      .string()
      .trim()
      .min(3, "Judul sesi minimal 3 karakter")
      .max(120, "Judul sesi maksimal 120 karakter")
      .optional(),
    startsAt: isoDateStringSchema.optional(),
    endsAt: isoDateStringSchema.optional(),
    venue: z.string().trim().max(200, "Venue maksimal 200 karakter").optional().nullable(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    radiusMeters: radiusMetersSchema.optional(),
    lateToleranceMinutes: z
      .number()
      .int()
      .min(0, "Toleransi terlambat minimal 0 menit")
      .max(120, "Toleransi terlambat maksimal 120 menit")
      .optional(),
    notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "Jam selesai harus setelah jam mulai.",
      path: ["endsAt"],
    },
  )
  .refine(
    (data) => {
      if (data.latitude !== undefined || data.longitude !== undefined) {
        return hasValidCoordPair(data);
      }
      return true;
    },
    {
      message: "Koordinat latitude dan longitude harus diisi lengkap.",
      path: ["latitude"],
    },
  );

export const generateRoutineSchema = z
  .object({
    teamId: z.number().int().positive().optional(),
    weeks: z.number().int().min(1, "Minimal 1 minggu").max(4, "Maksimal 4 minggu").optional().default(4),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format startDate harus YYYY-MM-DD")
      .optional(),
    venue: z.string().trim().max(200).optional().default(DEFAULT_VENUE_PRESET.venue),
    latitude: latitudeSchema.default(DEFAULT_VENUE_PRESET.latitude),
    longitude: longitudeSchema.default(DEFAULT_VENUE_PRESET.longitude),
    radiusMeters: radiusMetersSchema.optional().default(DEFAULT_VENUE_PRESET.radiusMeters),
    lateToleranceMinutes: z.number().int().min(0).max(120).optional().default(15),
  })
  .refine(hasValidCoordPair, {
    message: "Koordinat latitude dan longitude harus diisi lengkap.",
    path: ["latitude"],
  });

export const listSessionsQuerySchema = z.object({
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  teamId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type GenerateRoutineInput = z.infer<typeof generateRoutineSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
