import { z } from "zod";

export const createMatchFormSchema = z
  .object({
    type: z.enum(["OFFICIAL", "FRIENDLY", "SCRIMMAGE"]).default("SCRIMMAGE"),
    format: z.enum(["K8", "K4"]).default("K8"),
    homeTeamId: z.coerce.number().int().positive({ message: "Tim Home harus dipilih." }),
    awayTeamId: z.coerce.number().int().positive({ message: "Tim Away harus dipilih." }),
    homeLabel: z.string().max(50).optional().nullable(),
    awayLabel: z.string().max(50).optional().nullable(),
    homeColor: z.string().max(7).default("#FACC15"),
    awayColor: z.string().max(7).default("#3B82F6"),
    competition: z.string().max(120).optional().nullable(),
    gameNumber: z.string().max(20).optional().nullable(),
    venue: z.string().max(200).optional().nullable(),
    scheduledAt: z.string().min(1, { message: "Jadwal pertandingan wajib diisi." }),
    periodCount: z.coerce.number().int().min(1).max(4).default(2),
    periodDurationMinutes: z.coerce.number().int().min(1).max(60).default(25),
    trackShotZone: z.boolean().default(false),
    juryChair: z.string().max(200).optional().nullable(),
    juryMembers: z.string().max(200).optional().nullable(),
    referees: z.string().max(200).optional().nullable(),
    homeHeadCoach: z.string().max(100).optional().nullable(),
    homeAssistantCoach: z.string().max(100).optional().nullable(),
    awayHeadCoach: z.string().max(100).optional().nullable(),
    awayAssistantCoach: z.string().max(100).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      // BR-16: Home = Away only allowed for SCRIMMAGE
      if (data.homeTeamId === data.awayTeamId && data.type !== "SCRIMMAGE") {
        return false;
      }
      return true;
    },
    {
      message: "Tim Home dan Away tidak boleh sama kecuali untuk tipe SCRIMMAGE.",
      path: ["awayTeamId"],
    },
  );

export const updateMatchFormSchema = z
  .object({
    type: z.enum(["OFFICIAL", "FRIENDLY", "SCRIMMAGE"]).optional(),
    format: z.enum(["K8", "K4"]).optional(),
    homeTeamId: z.coerce.number().int().positive().optional(),
    awayTeamId: z.coerce.number().int().positive().optional(),
    homeLabel: z.string().max(50).optional().nullable(),
    awayLabel: z.string().max(50).optional().nullable(),
    homeColor: z.string().max(7).optional(),
    awayColor: z.string().max(7).optional(),
    competition: z.string().max(120).optional().nullable(),
    gameNumber: z.string().max(20).optional().nullable(),
    venue: z.string().max(200).optional().nullable(),
    scheduledAt: z.string().optional(),
    periodCount: z.coerce.number().int().min(1).max(4).optional(),
    periodDurationMinutes: z.coerce.number().int().min(1).max(60).optional(),
    trackShotZone: z.boolean().optional(),
    juryChair: z.string().max(200).optional().nullable(),
    juryMembers: z.string().max(200).optional().nullable(),
    referees: z.string().max(200).optional().nullable(),
    homeHeadCoach: z.string().max(100).optional().nullable(),
    homeAssistantCoach: z.string().max(100).optional().nullable(),
    awayHeadCoach: z.string().max(100).optional().nullable(),
    awayAssistantCoach: z.string().max(100).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        data.homeTeamId &&
        data.awayTeamId &&
        data.homeTeamId === data.awayTeamId &&
        data.type &&
        data.type !== "SCRIMMAGE"
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Tim Home dan Away tidak boleh sama kecuali untuk tipe SCRIMMAGE.",
      path: ["awayTeamId"],
    },
  );

export const quickAddOpponentAthleteSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter.").max(100),
  nickname: z.string().max(30).optional(),
  sex: z.enum(["MALE", "FEMALE"]),
  jerseyNumber: z.coerce.number().int().min(0, "Minimal 0").max(99, "Maksimal 99"),
});

export type MatchFormInput = z.input<typeof createMatchFormSchema>;
export type MatchFormOutput = z.output<typeof createMatchFormSchema>;
export type CreateMatchFormValues = MatchFormOutput;
export type UpdateMatchFormValues = z.infer<typeof updateMatchFormSchema>;
export type QuickAddOpponentAthleteValues = z.infer<typeof quickAddOpponentAthleteSchema>;
