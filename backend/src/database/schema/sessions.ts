import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sessionStatusEnum, sessionTypeEnum } from "./enums.js";
import { teams } from "./teams.js";
import { users } from "./users.js";

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    type: sessionTypeEnum("type").default("TRAINING").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    venue: varchar("venue", { length: 200 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    radiusMeters: integer("radius_meters").default(100).notNull(),
    lateToleranceMinutes: smallint("late_tolerance_minutes").default(15).notNull(),
    checkinCode: varchar("checkin_code", { length: 6 }).notNull(),
    status: sessionStatusEnum("status").default("SCHEDULED").notNull(),
    notes: varchar("notes", { length: 500 }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    finalizedBy: integer("finalized_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check("sessions_ends_after_starts_check", sql`${table.endsAt} > ${table.startsAt}`),
    check(
      "sessions_late_tolerance_check",
      sql`${table.lateToleranceMinutes} >= 0 AND ${table.lateToleranceMinutes} <= 120`,
    ),
    check("sessions_radius_meters_check", sql`${table.radiusMeters} >= 20 AND ${table.radiusMeters} <= 2000`),
    check(
      "sessions_coords_pair_check",
      sql`(${table.latitude} IS NULL AND ${table.longitude} IS NULL) OR (${table.latitude} IS NOT NULL AND ${table.longitude} IS NOT NULL)`,
    ),
    index("sessions_team_starts_at_idx").on(table.teamId, table.startsAt),
    index("sessions_checkin_code_idx").on(table.checkinCode),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
