import { index, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { athletes } from "./athletes.js";
import { attendanceMethodEnum, attendanceStatusEnum } from "./enums.js";
import { sessions } from "./sessions.js";
import { users } from "./users.js";

export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    athleteId: integer("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "restrict" }),
    status: attendanceStatusEnum("status").notNull(),
    method: attendanceMethodEnum("method").default("MANUAL").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    note: varchar("note", { length: 250 }),
    recordedBy: integer("recorded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("attendances_session_athlete_unique").on(table.sessionId, table.athleteId),
    index("attendances_athlete_id_idx").on(table.athleteId),
  ],
);

export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
