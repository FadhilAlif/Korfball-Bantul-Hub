import { z } from "zod";

export const athleteFormSchema = z.object({
  teamId: z.coerce.number().int().positive("Tim wajib dipilih"),
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama lengkap maksimal 100 karakter"),
  nickname: z
    .string()
    .trim()
    .max(30, "Nama panggilan maksimal 30 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  sex: z.enum(["MALE", "FEMALE"], {
    message: "Jenis kelamin wajib dipilih (Laki - Laki / Perempuan)",
  }),
  jerseyNumber: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isNaN(n) ? Number.NaN : n;
    })
    .refine((val) => val === null || (Number.isInteger(val) && val >= 0 && val <= 99), {
      message: "Nomor punggung harus bilangan bulat antara 0–99",
    }),
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (val) => {
        if (!val) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
        const parsed = new Date(`${val}T00:00:00Z`);
        return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
      },
      { message: "Tanggal lahir harus format YYYY-MM-DD dan tidak di masa depan" },
    ),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type AthleteFormInput = z.input<typeof athleteFormSchema>;
export type AthleteFormOutput = z.output<typeof athleteFormSchema>;
