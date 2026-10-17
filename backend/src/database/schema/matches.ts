import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, serial, smallint, timestamp, varchar } from "drizzle-orm/pg-core";
import { matchFormatEnum, matchStatusEnum, matchTypeEnum } from "./enums.js";
import { sessions } from "./sessions.js";
import { teams } from "./teams.js";
import { users } from "./users.js";

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    type: matchTypeEnum("type").default("SCRIMMAGE").notNull(),
    format: matchFormatEnum("format").default("K8").notNull(),
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    homeLabel: varchar("home_label", { length: 50 }),
    awayLabel: varchar("away_label", { length: 50 }),
    homeColor: varchar("home_color", { length: 7 }).default("#FACC15").notNull(),
    awayColor: varchar("away_color", { length: 7 }).default("#3B82F6").notNull(),
    competition: varchar("competition", { length: 120 }),
    gameNumber: varchar("game_number", { length: 20 }),
    venue: varchar("venue", { length: 200 }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    periodCount: smallint("period_count").default(2).notNull(),
    periodDurationMinutes: smallint("period_duration_minutes").default(25).notNull(),
    trackShotZone: boolean("track_shot_zone").default(false).notNull(),
    status: matchStatusEnum("status").default("SCHEDULED").notNull(),
    currentPeriod: smallint("current_period"),
    clockRemainingSeconds: integer("clock_remaining_seconds"),
    clockRunningSince: timestamp("clock_running_since", { withTimezone: true }),
    homeScore: integer("home_score").default(0).notNull(),
    awayScore: integer("away_score").default(0).notNull(),
    juryChair: varchar("jury_chair", { length: 200 }),
    juryMembers: varchar("jury_members", { length: 200 }),
    referees: varchar("referees", { length: 200 }),
    homeHeadCoach: varchar("home_head_coach", { length: 100 }),
    homeAssistantCoach: varchar("home_assistant_coach", { length: 100 }),
    awayHeadCoach: varchar("away_head_coach", { length: 100 }),
    awayAssistantCoach: varchar("away_assistant_coach", { length: 100 }),
    sessionId: integer("session_id").references(() => sessions.id, { onDelete: "set null" }),
    notes: varchar("notes", { length: 1000 }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    finishedBy: integer("finished_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("matches_scheduled_at_idx").on(table.scheduledAt),
    index("matches_status_idx").on(table.status),
    check("matches_period_count_check", sql`${table.periodCount} >= 1 AND ${table.periodCount} <= 4`),
    check(
      "matches_period_duration_check",
      sql`${table.periodDurationMinutes} >= 1 AND ${table.periodDurationMinutes} <= 60`,
    ),
  ],
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
