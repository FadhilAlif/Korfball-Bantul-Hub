import { sql } from "drizzle-orm";
import { boolean, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    shortName: varchar("short_name", { length: 20 }),
    isInternal: boolean("is_internal").default(false).notNull(),
    region: varchar("region", { length: 100 }),
    color: varchar("color", { length: 7 }).default("#3B82F6").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("teams_name_lower_unique_idx").on(sql`lower(${table.name})`).where(sql`${table.deletedAt} IS NULL`),
  ],
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
