CREATE TYPE "public"."athlete_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."attendance_method" AS ENUM('MANUAL', 'SELF_CHECKIN', 'EXCUSE_REQUEST', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'LATE', 'EXCUSED', 'ABSENT');--> statement-breakpoint
CREATE TYPE "public"."match_event_type" AS ENUM('SHOT_MADE', 'SHOT_MISSED', 'RUNNING_IN_MADE', 'RUNNING_IN_MISSED', 'PENALTY_MADE', 'PENALTY_MISSED', 'REBOUND_DEF', 'REBOUND_OFF', 'DECK', 'ASSIST', 'INTERCEPT', 'TURNOVER', 'TEAM_TURNOVER', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'TIMEOUT', 'PERIOD_START', 'PERIOD_END');--> statement-breakpoint
CREATE TYPE "public"."match_format" AS ENUM('K8', 'K4');--> statement-breakpoint
CREATE TYPE "public"."match_side" AS ENUM('HOME', 'AWAY');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('OFFICIAL', 'FRIENDLY', 'SCRIMMAGE');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('TRAINING', 'SCRIMMAGE', 'MATCH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"short_name" varchar(20),
	"is_internal" boolean DEFAULT false NOT NULL,
	"region" varchar(100),
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"full_name" varchar(100) NOT NULL,
	"nickname" varchar(30),
	"sex" "sex" NOT NULL,
	"jersey_number" smallint,
	"birth_date" date,
	"status" "athlete_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "athletes_jersey_number_check" CHECK ("athletes"."jersey_number" IS NULL OR ("athletes"."jersey_number" >= 0 AND "athletes"."jersey_number" <= 99))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"type" "session_type" DEFAULT 'TRAINING' NOT NULL,
	"title" varchar(120) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue" varchar(200),
	"late_tolerance_minutes" smallint DEFAULT 15 NOT NULL,
	"checkin_code" varchar(6) NOT NULL,
	"status" "session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"notes" varchar(500),
	"created_by" integer,
	"finalized_at" timestamp with time zone,
	"finalized_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sessions_ends_after_starts_check" CHECK ("sessions"."ends_at" > "sessions"."starts_at"),
	CONSTRAINT "sessions_late_tolerance_check" CHECK ("sessions"."late_tolerance_minutes" >= 0 AND "sessions"."late_tolerance_minutes" <= 120)
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"athlete_id" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"method" "attendance_method" DEFAULT 'MANUAL' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"note" varchar(250),
	"recorded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendances_session_athlete_unique" UNIQUE("session_id","athlete_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "match_type" DEFAULT 'SCRIMMAGE' NOT NULL,
	"format" "match_format" DEFAULT 'K8' NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_label" varchar(50),
	"away_label" varchar(50),
	"home_color" varchar(7) DEFAULT '#FACC15' NOT NULL,
	"away_color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"competition" varchar(120),
	"game_number" varchar(20),
	"venue" varchar(200),
	"scheduled_at" timestamp with time zone NOT NULL,
	"period_count" smallint DEFAULT 2 NOT NULL,
	"period_duration_minutes" smallint DEFAULT 25 NOT NULL,
	"track_shot_zone" boolean DEFAULT false NOT NULL,
	"status" "match_status" DEFAULT 'SCHEDULED' NOT NULL,
	"current_period" smallint,
	"clock_remaining_seconds" integer,
	"clock_running_since" timestamp with time zone,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"jury_chair" varchar(200),
	"jury_members" varchar(200),
	"referees" varchar(200),
	"home_head_coach" varchar(100),
	"home_assistant_coach" varchar(100),
	"away_head_coach" varchar(100),
	"away_assistant_coach" varchar(100),
	"session_id" integer,
	"notes" varchar(1000),
	"created_by" integer,
	"finished_at" timestamp with time zone,
	"finished_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "matches_period_count_check" CHECK ("matches"."period_count" >= 1 AND "matches"."period_count" <= 4),
	CONSTRAINT "matches_period_duration_check" CHECK ("matches"."period_duration_minutes" >= 1 AND "matches"."period_duration_minutes" <= 60)
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"athlete_id" integer NOT NULL,
	"side" "match_side" NOT NULL,
	"jersey_number" smallint NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_players_match_athlete_unique" UNIQUE("match_id","athlete_id"),
	CONSTRAINT "match_players_jersey_number_check" CHECK ("match_players"."jersey_number" >= 0 AND "match_players"."jersey_number" <= 99)
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seq" bigserial NOT NULL,
	"match_id" integer NOT NULL,
	"side" "match_side" NOT NULL,
	"type" "match_event_type" NOT NULL,
	"match_player_id" integer,
	"sub_in_player_id" integer,
	"related_event_id" uuid,
	"period" smallint NOT NULL,
	"clock_seconds" integer NOT NULL,
	"shot_sector" smallint,
	"shot_distance_zone" smallint,
	"note" varchar(250),
	"client_recorded_at" timestamp with time zone NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "match_events_shot_sector_check" CHECK ("match_events"."shot_sector" IS NULL OR ("match_events"."shot_sector" >= 1 AND "match_events"."shot_sector" <= 8)),
	CONSTRAINT "match_events_shot_distance_zone_check" CHECK ("match_events"."shot_distance_zone" IS NULL OR ("match_events"."shot_distance_zone" >= 1 AND "match_events"."shot_distance_zone" <= 6))
);
--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_finished_by_users_id_fk" FOREIGN KEY ("finished_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_player_id_match_players_id_fk" FOREIGN KEY ("match_player_id") REFERENCES "public"."match_players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_sub_in_player_id_match_players_id_fk" FOREIGN KEY ("sub_in_player_id") REFERENCES "public"."match_players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teams_name_lower_unique_idx" ON "teams" USING btree (lower("name")) WHERE "teams"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "athletes_user_id_unique_idx" ON "athletes" USING btree ("user_id") WHERE "athletes"."user_id" IS NOT NULL AND "athletes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "athletes_team_status_idx" ON "athletes" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "sessions_team_starts_at_idx" ON "sessions" USING btree ("team_id","starts_at");--> statement-breakpoint
CREATE INDEX "sessions_checkin_code_idx" ON "sessions" USING btree ("checkin_code");--> statement-breakpoint
CREATE INDEX "attendances_athlete_id_idx" ON "attendances" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "matches_scheduled_at_idx" ON "matches" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "match_players_match_side_idx" ON "match_players" USING btree ("match_id","side");--> statement-breakpoint
CREATE INDEX "match_events_match_seq_idx" ON "match_events" USING btree ("match_id","seq");--> statement-breakpoint
CREATE INDEX "match_events_match_deleted_at_idx" ON "match_events" USING btree ("match_id","deleted_at");