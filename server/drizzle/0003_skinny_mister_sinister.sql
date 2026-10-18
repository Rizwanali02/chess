ALTER TABLE "matches" ADD COLUMN "white_time_remaining_ms" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "black_time_remaining_ms" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "last_clock_started_at" timestamp with time zone;