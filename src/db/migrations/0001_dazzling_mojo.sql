ALTER TABLE "gameScore_entries" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "gameScore_entries" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gameScore_entries" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;