ALTER TABLE "sessions" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "radius_meters" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "checkin_latitude" double precision;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "checkin_longitude" double precision;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "checkin_distance_meters" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_radius_meters_check" CHECK ("sessions"."radius_meters" >= 20 AND "sessions"."radius_meters" <= 2000);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_coords_pair_check" CHECK (("sessions"."latitude" IS NULL AND "sessions"."longitude" IS NULL) OR ("sessions"."latitude" IS NOT NULL AND "sessions"."longitude" IS NOT NULL));