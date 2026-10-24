import { z } from "zod";

export const linkedAthleteSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  nickname: z.string().nullable(),
  photoUrl: z.string().nullable().optional(),
  teamId: z.number(),
  jerseyNumber: z.number().nullable(),
  sex: z.enum(["MALE", "FEMALE"]),
});

export type LinkedAthlete = z.infer<typeof linkedAthleteSchema>;

export const authenticatedUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  athlete: linkedAthleteSchema.nullable().optional(),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const registerResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
