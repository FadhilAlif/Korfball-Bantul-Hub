import { z } from "zod";
import {
  matchEventTypeEnum,
  matchFormatEnum,
  matchSideEnum,
  matchStatusEnum,
  matchTypeEnum,
} from "../../database/schema/enums.js";

export const createMatchSchema = z
  .object({
    type: z.enum(matchTypeEnum.enumValues).default("SCRIMMAGE"),
    format: z.enum(matchFormatEnum.enumValues).default("K8"),
    homeTeamId: z.coerce.number().int().positive(),
    awayTeamId: z.coerce.number().int().positive(),
    homeLabel: z.string().max(50).optional().nullable(),
    awayLabel: z.string().max(50).optional().nullable(),
    homeColor: z.string().max(7).default("#FACC15"),
    awayColor: z.string().max(7).default("#3B82F6"),
    competition: z.string().max(120).optional().nullable(),
    gameNumber: z.string().max(20).optional().nullable(),
    venue: z.string().max(200).optional().nullable(),
    scheduledAt: z.coerce.date(),
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
    sessionId: z.coerce.number().int().positive().optional().nullable(),
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

export const updateMatchSchema = z
  .object({
    type: z.enum(matchTypeEnum.enumValues).optional(),
    format: z.enum(matchFormatEnum.enumValues).optional(),
    homeTeamId: z.coerce.number().int().positive().optional(),
    awayTeamId: z.coerce.number().int().positive().optional(),
    homeLabel: z.string().max(50).optional().nullable(),
    awayLabel: z.string().max(50).optional().nullable(),
    homeColor: z.string().max(7).optional(),
    awayColor: z.string().max(7).optional(),
    competition: z.string().max(120).optional().nullable(),
    gameNumber: z.string().max(20).optional().nullable(),
    venue: z.string().max(200).optional().nullable(),
    scheduledAt: z.coerce.date().optional(),
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
    sessionId: z.coerce.number().int().positive().optional().nullable(),
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

export const lineupPlayerItemSchema = z.object({
  athleteId: z.coerce.number().int().positive(),
  jerseyNumber: z.coerce.number().int().min(0).max(99),
  isStarter: z.boolean().default(false),
});

export const setLineupSchema = z.object({
  side: z.enum(matchSideEnum.enumValues),
  players: z.array(lineupPlayerItemSchema).min(1, "Minimal pilih 1 atlet untuk lineup."),
});

export const startMatchSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const clockPatchSchema = z.object({
  currentPeriod: z.coerce.number().int().min(1).max(4).optional(),
  clockRemainingSeconds: z.coerce.number().int().min(0).max(3600).optional(),
  clockRunningSince: z.coerce.date().nullable().optional(),
});

export const batchEventItemSchema = z.object({
  id: z.string().uuid(),
  side: z.enum(matchSideEnum.enumValues),
  type: z.enum(matchEventTypeEnum.enumValues),
  matchPlayerId: z.coerce.number().int().positive().optional().nullable(),
  subInPlayerId: z.coerce.number().int().positive().optional().nullable(),
  relatedEventId: z.string().uuid().optional().nullable(),
  period: z.coerce.number().int().min(1).max(4),
  clockSeconds: z.coerce.number().int().min(0),
  shotSector: z.coerce.number().int().min(1).max(8).optional().nullable(),
  shotDistanceZone: z.coerce.number().int().min(1).max(6).optional().nullable(),
  note: z.string().max(250).optional().nullable(),
  clientRecordedAt: z.coerce.date(),
});

export const batchEventsSchema = z.object({
  events: z.array(batchEventItemSchema).min(1).max(50),
});

export const updateEventSchema = z.object({
  matchPlayerId: z.coerce.number().int().positive().optional().nullable(),
  subInPlayerId: z.coerce.number().int().positive().optional().nullable(),
  type: z.enum(matchEventTypeEnum.enumValues).optional(),
  shotSector: z.coerce.number().int().min(1).max(8).optional().nullable(),
  shotDistanceZone: z.coerce.number().int().min(1).max(6).optional().nullable(),
  note: z.string().max(250).optional().nullable(),
});

export const listMatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  teamId: z.coerce.number().int().positive().optional(),
  type: z.enum(matchTypeEnum.enumValues).optional(),
  format: z.enum(matchFormatEnum.enumValues).optional(),
  status: z.enum(matchStatusEnum.enumValues).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const listEventsQuerySchema = z.object({
  afterSeq: z.coerce.number().int().min(0).optional(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type SetLineupInput = z.infer<typeof setLineupSchema>;
export type StartMatchInput = z.infer<typeof startMatchSchema>;
export type ClockPatchInput = z.infer<typeof clockPatchSchema>;
export type BatchEventsInput = z.infer<typeof batchEventsSchema>;
export type BatchEventItem = z.infer<typeof batchEventItemSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
