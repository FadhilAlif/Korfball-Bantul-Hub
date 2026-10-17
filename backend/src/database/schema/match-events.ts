import { sql } from "drizzle-orm";
import { bigserial, check, index, integer, pgTable, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { matchEventTypeEnum, matchSideEnum } from "./enums.js";
import { matchPlayers } from "./match-players.js";
import { matches } from "./matches.js";
import { users } from "./users.js";

export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey(),
    seq: bigserial("seq", { mode: "number" }).notNull(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    side: matchSideEnum("side").notNull(),
    type: matchEventTypeEnum("type").notNull(),
    matchPlayerId: integer("match_player_id").references(() => matchPlayers.id, {
      onDelete: "restrict",
    }),
    subInPlayerId: integer("sub_in_player_id").references(() => matchPlayers.id, {
      onDelete: "restrict",
    }),
    relatedEventId: uuid("related_event_id"),
    period: smallint("period").notNull(),
    clockSeconds: integer("clock_seconds").notNull(),
    shotSector: smallint("shot_sector"),
    shotDistanceZone: smallint("shot_distance_zone"),
    note: varchar("note", { length: 250 }),
    clientRecordedAt: timestamp("client_recorded_at", { withTimezone: true }).notNull(),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: integer("deleted_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("match_events_match_seq_idx").on(table.matchId, table.seq),
    index("match_events_match_deleted_at_idx").on(table.matchId, table.deletedAt),
    check(
      "match_events_shot_sector_check",
      sql`${table.shotSector} IS NULL OR (${table.shotSector} >= 1 AND ${table.shotSector} <= 8)`,
    ),
    check(
      "match_events_shot_distance_zone_check",
      sql`${table.shotDistanceZone} IS NULL OR (${table.shotDistanceZone} >= 1 AND ${table.shotDistanceZone} <= 6)`,
    ),
  ],
);

export type MatchEvent = typeof matchEvents.$inferSelect;
export type NewMatchEvent = typeof matchEvents.$inferInsert;
