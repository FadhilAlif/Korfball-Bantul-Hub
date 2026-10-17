import { z } from "zod";

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
  );

export type SessionFormInput = z.input<typeof sessionFormSchema>;
export type SessionFormOutput = z.output<typeof sessionFormSchema>;

export const generateRoutineFormSchema = z.object({
  weeks: z.coerce.number().int().min(1, "Minimal 1 minggu").max(4, "Maksimal 4 minggu").default(4),
  venue: z
    .string()
    .trim()
    .min(2, "Venue wajib diisi")
    .max(200, "Venue maksimal 200 karakter")
    .default("GOR Stadion Sultan Agung Bantul"),
  lateToleranceMinutes: z.coerce.number().int().min(0).max(120).default(15),
});

export type GenerateRoutineFormInput = z.input<typeof generateRoutineFormSchema>;
export type GenerateRoutineFormOutput = z.output<typeof generateRoutineFormSchema>;
