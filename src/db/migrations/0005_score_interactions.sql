CREATE TABLE IF NOT EXISTS "score_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"score_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "score_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"score_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_reactions_score_id_user_id_emoji_type_unique" UNIQUE("score_id","user_id","emoji_type")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "score_comments" ADD CONSTRAINT "score_comments_score_id_gameScore_entries_id_fk" FOREIGN KEY ("score_id") REFERENCES "gameScore_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "score_comments" ADD CONSTRAINT "score_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "score_reactions" ADD CONSTRAINT "score_reactions_score_id_gameScore_entries_id_fk" FOREIGN KEY ("score_id") REFERENCES "gameScore_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "score_reactions" ADD CONSTRAINT "score_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "score_reactions" ADD CONSTRAINT "score_reactions_emoji_type_check" CHECK ("emoji_type" IN ('👍', '🔥', '😮', '😂', '❤️', '🎉'));