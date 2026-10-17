import { z } from "zod";

const isoDateStringSchema = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: "Format tanggal tidak valid (gunakan ISO 8601).",
});

export const createSessionSchema = z
  .object({
    teamId: z.number().int().positive().optional(),
    type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).optional().default("TRAINING"),
    title: z.string().trim().min(3, "Judul sesi minimal 3 karakter").max(120, "Judul sesi maksimal 120 karakter"),
    startsAt: isoDateStringSchema,
    endsAt: isoDateStringSchema,
    venue: z.string().trim().max(200, "Venue maksimal 200 karakter").optional().nullable(),
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
  );

export const generateRoutineSchema = z.object({
  teamId: z.number().int().positive().optional(),
  weeks: z.number().int().min(1, "Minimal 1 minggu").max(4, "Maksimal 4 minggu").optional().default(4),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format startDate harus YYYY-MM-DD")
    .optional(),
  venue: z.string().trim().max(200).optional().default("GOR Stadion Sultan Agung Bantul"),
  lateToleranceMinutes: z.number().int().min(0).max(120).optional().default(15),
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
