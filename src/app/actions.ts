"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseWithZod } from "@conform-to/zod";
import { and, eq, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";

import options from "@/config/auth";
import db from "@/db";
import gameScoreEntries, {
  InsertGameScoreEntrySchema,
} from "@/db/schema/game-score-entries";
import requireAuth from "@/utils/require-auth";

export async function createGameScoreEntry(
  prevState: unknown,
  formData: FormData
) {
  await requireAuth();

  const submission = parseWithZod(formData, {
    schema: InsertGameScoreEntrySchema,
  });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const session = (await getServerSession(options))!;

  // Check for duplicate scores for the same game today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingScore = await db.query.gameScoreEntries.findFirst({
    where: and(
      eq(gameScoreEntries.userId, session.user.id),
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
    userId: session.user.id,
    message: submission.value.message,
    gameType: submission.value.gameType,
    score: submission.value.score,
    rating: submission.value.rating,
  });

  revalidatePath("/");
  redirect("/");
}
