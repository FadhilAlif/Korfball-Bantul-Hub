import { z } from "zod";

export const selfCheckinFormSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9]{6}$/.test(v), "Kode check-in harus terdiri dari 6 karakter huruf/angka"),
});

export type SelfCheckinFormInput = z.input<typeof selfCheckinFormSchema>;
export type SelfCheckinFormOutput = z.output<typeof selfCheckinFormSchema>;

export const excuseFormSchema = z.object({
  reason: z.string().trim().min(5, "Alasan izin minimal 5 karakter").max(250, "Alasan izin maksimal 250 karakter"),
});

export type ExcuseFormInput = z.input<typeof excuseFormSchema>;
export type ExcuseFormOutput = z.output<typeof excuseFormSchema>;
