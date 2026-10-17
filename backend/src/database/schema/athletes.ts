import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { athleteStatusEnum, sexEnum } from "./enums.js";
import { teams } from "./teams.js";
import { users } from "./users.js";

export const athletes = pgTable(
  "athletes",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    nickname: varchar("nickname", { length: 30 }),
    sex: sexEnum("sex").notNull(),
    jerseyNumber: smallint("jersey_number"),
    birthDate: date("birth_date"),
    status: athleteStatusEnum("status").default("ACTIVE").notNull(),
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("athletes_user_id_unique_idx")
      .on(table.userId)
      .where(sql`${table.userId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    index("athletes_team_status_idx").on(table.teamId, table.status),
    check(
      "athletes_jersey_number_check",
      sql`${table.jerseyNumber} IS NULL OR (${table.jerseyNumber} >= 0 AND ${table.jerseyNumber} <= 99)`,
    ),
  ],
);

export type Athlete = typeof athletes.$inferSelect;
export type NewAthlete = typeof athletes.$inferInsert;
