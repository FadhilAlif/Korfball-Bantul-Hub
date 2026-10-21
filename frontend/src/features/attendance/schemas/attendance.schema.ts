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

export const selfCheckinGpsSchema = z.object({
  sessionId: z.number().int().positive("Sesi latihan wajib dipilih"),
  latitude: z.number().min(-90, "Latitude tidak valid").max(90, "Latitude tidak valid"),
  longitude: z.number().min(-180, "Longitude tidak valid").max(180, "Longitude tidak valid"),
});

export type SelfCheckinGpsInput = z.infer<typeof selfCheckinGpsSchema>;

export const excuseFormSchema = z.object({
  reason: z.string().trim().min(5, "Alasan izin minimal 5 karakter").max(250, "Alasan izin maksimal 250 karakter"),
});

export type ExcuseFormInput = z.input<typeof excuseFormSchema>;
export type ExcuseFormOutput = z.output<typeof excuseFormSchema>;

/**
 * UI indicator helper to preview distance in meters before submitting to backend.
 * Note: Authoritative validation is always performed on the server (BR-34).
 */
export function estimateDistanceMetersUi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return Math.round(R * c);
}
