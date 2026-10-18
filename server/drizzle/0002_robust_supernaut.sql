CREATE TYPE "public"."match_result" AS ENUM('WHITE_WIN', 'BLACK_WIN', 'DRAW');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"white_player_id" uuid NOT NULL,
	"black_player_id" uuid NOT NULL,
	"status" "match_status" DEFAULT 'WAITING' NOT NULL,
	"result" "match_result",
	"initial_seconds" integer NOT NULL,
	"increment_seconds" integer DEFAULT 0 NOT NULL,
	"pgn" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchmaking_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_white_player_id_users_id_fk" FOREIGN KEY ("white_player_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_black_player_id_users_id_fk" FOREIGN KEY ("black_player_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "matches_tournament_players_unique" ON "matches" USING btree ("tournament_id","white_player_id","black_player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matchmaking_queue_tournament_user_unique" ON "matchmaking_queue" USING btree ("tournament_id","user_id");