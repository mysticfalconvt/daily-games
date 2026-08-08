CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"target_user_id" text,
	"action" text NOT NULL,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text,
	"is_new_user" boolean DEFAULT false NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "interactions_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
--
-- Backfill: anyone who already opted into private scores gets private
-- interactions too. Defaulting them to public would leak their comments to
-- strangers between this deploy and the moment they notice the new toggle.
--
UPDATE "user" SET "interactions_private" = true WHERE "is_private" = true;--> statement-breakpoint
--
-- Backfill: without this every existing user reads as "joined today" in the
-- admin view. Their first score is the closest thing to a signup timestamp.
--
UPDATE "user" u
SET "created_at" = s."first_score"
FROM (
  SELECT "userId" AS id, MIN("created_at") AS "first_score"
  FROM "gameScore_entries"
  GROUP BY "userId"
) s
WHERE u."id" = s.id AND s."first_score" < u."created_at";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_events_user_id_created_at_idx" ON "login_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_requests_receiverId_status_idx" ON "friend_requests" USING btree ("receiverId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_requests_senderId_status_idx" ON "friend_requests" USING btree ("senderId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friendships_userId_idx" ON "friendships" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gameScore_entries_userId_created_at_idx" ON "gameScore_entries" USING btree ("userId","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gameScore_entries_created_at_idx" ON "gameScore_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_comments_score_id_idx" ON "score_comments" USING btree ("score_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_reactions_score_id_idx" ON "score_reactions" USING btree ("score_id");--> statement-breakpoint
--
-- Collapse any duplicate friendship rows before the unique constraint lands.
-- Nothing stopped a double-accept from inserting the same pair twice, and
-- ADD CONSTRAINT would abort the whole migration if prod has any.
--
DELETE FROM "friendships" a
USING "friendships" b
WHERE a."id" > b."id"
  AND a."userId" = b."userId"
  AND a."friendId" = b."friendId";--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userId_friendId_unique" UNIQUE("userId","friendId");