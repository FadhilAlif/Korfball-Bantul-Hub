import { z } from "zod";

export const playerLeaderboardQuerySchema = z.object({
  teamId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  types: z.string().optional(), // comma-separated list of match types, e.g. "OFFICIAL,FRIENDLY"
  minGp: z.coerce.number().int().min(0).default(1),
  sort: z
    .enum([
      "pts",
      "ppg",
      "eff",
      "epg",
      "sm",
      "sa",
      "pctFgs",
      "rim",
      "ria",
      "pctFgr",
      "pm",
      "pa",
      "pctP",
      "pctFgTotal",
      "tot",
      "dr",
      "or",
      "rpg",
      "d",
      "as",
      "apg",
      "it",
      "tov",
      "f",
      "yc",
      "rc",
      "gp",
      "athleteName",
    ])
    .default("pts"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PlayerLeaderboardQuery = z.infer<typeof playerLeaderboardQuerySchema>;

export const teamStatsQuerySchema = z.object({
  teamId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  types: z.string().optional(),
});

export type TeamStatsQuery = z.infer<typeof teamStatsQuerySchema>;
