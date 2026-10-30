import { notFound } from "next/navigation";

import { eq } from "drizzle-orm";

import { ScoreInteractions } from "@/components/interactions/score-interactions";
import db from "@/db";
import { gameScoreEntries } from "@/db/schema";
import { requireUser } from "@/lib/auth-context";
import { VisibilityService } from "@/services/visibility-service";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

export default async function ScorePage({
  params,
}: {
  params: { scoreId: string };
}) {
  const { user } = await requireUser();
  const score = await db.query.gameScoreEntries.findFirst({
    where: eq(gameScoreEntries.id, params.scoreId),
  });
  if (
    !score ||
    !(await VisibilityService.canViewScoresOf(user.id, score.userId))
  )
    notFound();
  return (
    <main className="app-container py-8">
      <div className="rounded-lg border p-5">
        <h1 className="text-xl font-semibold">
          {getPrettyGameType(score.gameType)}
        </h1>
        <p className="mt-3 whitespace-pre-wrap">{score.score}</p>
        {score.message && (
          <p className="mt-2 text-muted-foreground">{score.message}</p>
        )}
        <ScoreInteractions
          scoreId={score.id}
          currentUserId={user.id}
          scoreOwnerId={score.userId}
        />
      </div>
    </main>
  );
}
