import { pgEnum } from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["MALE", "FEMALE"]);

export const athleteStatusEnum = pgEnum("athlete_status", ["ACTIVE", "INACTIVE"]);

export const sessionTypeEnum = pgEnum("session_type", ["TRAINING", "SCRIMMAGE", "MATCH", "OTHER"]);

export const sessionStatusEnum = pgEnum("session_status", ["SCHEDULED", "COMPLETED", "CANCELLED"]);

export const attendanceStatusEnum = pgEnum("attendance_status", ["PRESENT", "LATE", "EXCUSED", "ABSENT"]);

export const attendanceMethodEnum = pgEnum("attendance_method", ["MANUAL", "SELF_CHECKIN", "EXCUSE_REQUEST", "SYSTEM"]);

export const matchTypeEnum = pgEnum("match_type", ["OFFICIAL", "FRIENDLY", "SCRIMMAGE"]);

export const matchFormatEnum = pgEnum("match_format", ["K8", "K4"]);

export const matchStatusEnum = pgEnum("match_status", ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"]);

export const matchSideEnum = pgEnum("match_side", ["HOME", "AWAY"]);

export const matchEventTypeEnum = pgEnum("match_event_type", [
  "SHOT_MADE",
  "SHOT_MISSED",
  "RUNNING_IN_MADE",
  "RUNNING_IN_MISSED",
  "PENALTY_MADE",
  "PENALTY_MISSED",
  "REBOUND_DEF",
  "REBOUND_OFF",
  "DECK",
  "ASSIST",
  "INTERCEPT",
  "TURNOVER",
  "TEAM_TURNOVER",
  "FOUL",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION",
  "TIMEOUT",
  "PERIOD_START",
  "PERIOD_END",
]);

export type Sex = (typeof sexEnum.enumValues)[number];
export type AthleteStatus = (typeof athleteStatusEnum.enumValues)[number];
export type SessionType = (typeof sessionTypeEnum.enumValues)[number];
export type SessionStatus = (typeof sessionStatusEnum.enumValues)[number];
export type AttendanceStatus = (typeof attendanceStatusEnum.enumValues)[number];
export type AttendanceMethod = (typeof attendanceMethodEnum.enumValues)[number];
export type MatchType = (typeof matchTypeEnum.enumValues)[number];
export type MatchFormat = (typeof matchFormatEnum.enumValues)[number];
export type MatchStatus = (typeof matchStatusEnum.enumValues)[number];
export type MatchSide = (typeof matchSideEnum.enumValues)[number];
export type MatchEventType = (typeof matchEventTypeEnum.enumValues)[number];
