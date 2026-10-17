import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter").max(100, "Nama tim maksimal 100 karakter"),
  shortName: z
    .string()
    .trim()
    .max(20, "Nama singkat maksimal 20 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || v.length >= 2, "Nama singkat minimal 2 karakter"),
  region: z
    .string()
    .trim()
    .max(100, "Kota/Daerah maksimal 100 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isInternal: z.boolean().default(false),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus Hex #RRGGBB"),
});

export type TeamFormInput = z.input<typeof teamFormSchema>;
export type TeamFormOutput = z.output<typeof teamFormSchema>;
