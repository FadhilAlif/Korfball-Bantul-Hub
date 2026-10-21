import { z } from "zod";

export const bulkAttendanceRecordSchema = z.object({
  records: z
    .array(
      z.object({
        athleteId: z.number().int().positive("athleteId wajib diisi"),
        status: z.enum(["PRESENT", "LATE", "EXCUSED", "ABSENT"], {
          message: "Status presensi harus PRESENT, LATE, EXCUSED, atau ABSENT",
        }),
        note: z.string().trim().max(250, "Catatan maksimal 250 karakter").optional().nullable(),
      }),
    )
    .min(1, "Minimal 1 data presensi")
    .max(100, "Maksimal 100 data presensi per request"),
});

export const selfCheckinByCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Kode check-in harus 6 karakter")
    .max(6, "Kode check-in harus 6 karakter")
    .transform((val) => val.toUpperCase()),
});

export const selfCheckinByGpsSchema = z.object({
  sessionId: z.number().int().positive("sessionId wajib diisi"),
  latitude: z
    .number()
    .min(-90, "Latitude harus berada di antara -90 dan 90.")
    .max(90, "Latitude harus berada di antara -90 dan 90."),
  longitude: z
    .number()
    .min(-180, "Longitude harus berada di antara -180 dan 180.")
    .max(180, "Longitude harus berada di antara -180 dan 180."),
});

export const selfCheckinSchema = z.union([selfCheckinByGpsSchema, selfCheckinByCodeSchema]);

export const excuseRequestSchema = z.object({
  reason: z.string().trim().min(5, "Alasan izin minimal 5 karakter").max(250, "Alasan izin maksimal 250 karakter"),
});

export const attendanceSummaryQuerySchema = z
  .object({
    from: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format from harus YYYY-MM-DD"),
    to: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format to harus YYYY-MM-DD"),
    type: z.enum(["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine(
    (data) => {
      const fromDate = new Date(`${data.from}T00:00:00Z`);
      const toDate = new Date(`${data.to}T00:00:00Z`);
      if (toDate < fromDate) return false;
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 366;
    },
    {
      message: "Rentang tanggal harus valid dan maksimal 366 hari.",
      path: ["to"],
    },
  );

export const myAttendanceQuerySchema = z.object({
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type BulkAttendanceInput = z.infer<typeof bulkAttendanceRecordSchema>;
export type SelfCheckinInput = z.infer<typeof selfCheckinSchema>;
export type ExcuseRequestInput = z.infer<typeof excuseRequestSchema>;
export type AttendanceSummaryQuery = z.infer<typeof attendanceSummaryQuerySchema>;
export type MyAttendanceQuery = z.infer<typeof myAttendanceQuerySchema>;
