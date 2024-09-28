"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseWithZod } from "@conform-to/zod";
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
