import { z } from "zod";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const uploadImageSchema = z.object({
  folder: z.enum(["avatars", "athletes"]).default("avatars"),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Format gambar harus JPEG, PNG, WebP, atau GIF",
  }),
  base64Data: z.string().min(20, "Data gambar tidak valid").max(5_000_000, "Ukuran gambar maksimal adalah 3 MB"),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
