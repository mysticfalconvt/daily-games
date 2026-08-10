"use server";

import { revalidatePath } from "next/cache";

import { parseWithZod } from "@conform-to/zod";
import { and, eq, gte } from "drizzle-orm";

import db from "@/db";
import gameScoreEntries, {
  InsertGameScoreEntrySchema,
} from "@/db/schema/game-score-entries";
import { requireUser } from "@/lib/auth-context";
import { MAX_MEASURED_MS, MIN_MEASURED_MS } from "@/utils/game-timing";

/**
 * The duration is measured and reported by the browser, so it is only as
 * trustworthy as the client. Rather than reject a whole score over it, anything
 * missing, malformed or outside the plausible range is stored as null and the
 * feed falls back to inferring a time from the gap between posts.
 */
function parseDurationMs(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw === "") return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;

  const ms = Math.round(parsed);
  if (ms < MIN_MEASURED_MS || ms > MAX_MEASURED_MS) return null;

  return ms;
}

export async function createGameScoreEntry(
  prevState: unknown,
  formData: FormData
) {
  const { user, impersonation } = await requireUser();

  const submission = parseWithZod(formData, {
    schema: InsertGameScoreEntrySchema,
  });
  if (submission.status !== "success") {
    return submission.reply();
  }

  // Impersonation is read-only, so an admin cannot leave a real score behind
  // under someone else's name.
  if (impersonation) {
    return submission.reply({
      formErrors: [
        "Impersonation is read-only. Stop impersonating to submit a score.",
      ],
    });
  }

  // Check for duplicate scores for the same game today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingScore = await db.query.gameScoreEntries.findFirst({
    where: and(
      eq(gameScoreEntries.userId, user.id),
      eq(gameScoreEntries.gameType, submission.value.gameType),
      gte(gameScoreEntries.createdAt, today)
    ),
  });

  if (existingScore) {
    return submission.reply({
      formErrors: [
        `You've already submitted a score for ${submission.value.gameType} today.`,
      ],
    });
  }

  await db.insert(gameScoreEntries).values({
    userId: user.id,
    message: submission.value.message,
    gameType: submission.value.gameType,
    score: submission.value.score,
    rating: submission.value.rating,
    durationMs: parseDurationMs(formData.get("durationMs")),
  });

  revalidatePath("/");
  // Return success so the client can dispatch scoreSubmitted and refetch the feed.
  // redirect() would skip that path and leave ScoreCardList on stale local state.
  return submission.reply();
}
