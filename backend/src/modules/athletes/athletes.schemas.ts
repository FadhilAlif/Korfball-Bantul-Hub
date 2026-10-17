import { z } from "zod";

const birthDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir harus YYYY-MM-DD")
  .refine((val) => {
    const parsed = new Date(`${val}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
  }, "Tanggal lahir tidak boleh di masa depan");

export const createAthleteSchema = z.object({
  teamId: z.number().int().positive("Tim wajib dipilih"),
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama lengkap maksimal 100 karakter"),
  nickname: z.string().trim().max(30, "Nama panggilan maksimal 30 karakter").optional().nullable(),
  sex: z.enum(["MALE", "FEMALE"], {
    message: "Jenis kelamin wajib dipilih (MALE / FEMALE)",
  }),
  jerseyNumber: z
    .number()
    .int()
    .min(0, "Nomor punggung harus antara 0–99")
    .max(99, "Nomor punggung harus antara 0–99")
    .optional()
    .nullable(),
  birthDate: birthDateSchema.optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  userId: z.number().int().positive().optional().nullable(),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export const updateAthleteSchema = z.object({
  teamId: z.number().int().positive("Tim wajib dipilih").optional(),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter")
    .optional(),
  nickname: z.string().trim().max(30, "Nama panggilan maksimal 30 karakter").optional().nullable(),
  sex: z
    .enum(["MALE", "FEMALE"], {
      message: "Jenis kelamin wajib dipilih (MALE / FEMALE)",
    })
    .optional(),
  jerseyNumber: z
    .number()
    .int()
    .min(0, "Nomor punggung harus antara 0–99")
    .max(99, "Nomor punggung harus antara 0–99")
    .optional()
    .nullable(),
  birthDate: birthDateSchema.optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  userId: z.number().int().positive().optional().nullable(),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export const linkAthleteUserSchema = z.object({
  userId: z.number().int().positive("User ID wajib diisi"),
});

export const listAthletesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  teamId: z.coerce.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  search: z.string().trim().optional(),
});

export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
export type LinkAthleteUserInput = z.infer<typeof linkAthleteUserSchema>;
export type ListAthletesQuery = z.infer<typeof listAthletesQuerySchema>;
