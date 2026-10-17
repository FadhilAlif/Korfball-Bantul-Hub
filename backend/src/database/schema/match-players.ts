import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, serial, smallint, timestamp, unique } from "drizzle-orm/pg-core";
import { athletes } from "./athletes.js";
import { matchSideEnum } from "./enums.js";
import { matches } from "./matches.js";

export const matchPlayers = pgTable(
  "match_players",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    athleteId: integer("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "restrict" }),
    side: matchSideEnum("side").notNull(),
    jerseyNumber: smallint("jersey_number").notNull(),
    isStarter: boolean("is_starter").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("match_players_match_athlete_unique").on(table.matchId, table.athleteId),
    index("match_players_match_side_idx").on(table.matchId, table.side),
    check("match_players_jersey_number_check", sql`${table.jerseyNumber} >= 0 AND ${table.jerseyNumber} <= 99`),
  ],
);

export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type NewMatchPlayer = typeof matchPlayers.$inferInsert;
