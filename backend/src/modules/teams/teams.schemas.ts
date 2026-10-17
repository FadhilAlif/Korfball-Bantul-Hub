import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter").max(100, "Nama tim maksimal 100 karakter"),
  shortName: z
    .string()
    .trim()
    .min(2, "Nama singkat minimal 2 karakter")
    .max(20, "Nama singkat maksimal 20 karakter")
    .optional()
    .nullable(),
  isInternal: z.boolean().optional().default(false),
  region: z.string().trim().max(100, "Kota/Daerah maksimal 100 karakter").optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus Hex #RRGGBB")
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter").max(100, "Nama tim maksimal 100 karakter").optional(),
  shortName: z
    .string()
    .trim()
    .min(2, "Nama singkat minimal 2 karakter")
    .max(20, "Nama singkat maksimal 20 karakter")
    .optional()
    .nullable(),
  isInternal: z.boolean().optional(),
  region: z.string().trim().max(100, "Kota/Daerah maksimal 100 karakter").optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus Hex #RRGGBB")
    .optional(),
});

export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isInternal: z.enum(["true", "false"]).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
