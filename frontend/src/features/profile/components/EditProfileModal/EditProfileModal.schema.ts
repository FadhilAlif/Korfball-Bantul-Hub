import { z } from "zod";

export const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  avatarUrl: z.string().nullable().optional(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
