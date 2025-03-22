import { Card, CardBody } from "@nextui-org/react";
import { and, eq, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";

import AddGameScoreForm from "@/components/add-game-score-form";
import AvailableGamesList from "@/components/available-games-list";
import { ScoreCardList } from "@/components/score-card-list";
import options from "@/config/auth";
import db from "@/db";
import gameScoreEntries from "@/db/schema/game-score-entries";

export default async function Home() {
  const session = (await getServerSession(options))!;
  if (!session?.user) {
    return null;
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all games played today by the user
  const playedGames = await db.query.gameScoreEntries.findMany({
    where: and(
      eq(gameScoreEntries.userId, session.user.id),
      gte(gameScoreEntries.createdAt, today)
    ),
    columns: {
      gameType: true,
    },
  });

  const playedGameTypes = playedGames.map((game) => game.gameType);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start gap-2">
      <Card className="mx-auto mt-4 max-w-md">
        <CardBody className="text-center">
          <h1 className="text-5xl">Daily Game Scores</h1>
          <p className="text-xl">A place to share your scores</p>
        </CardBody>
      </Card>
      <AvailableGamesList playedGames={playedGameTypes} />
      <AddGameScoreForm />
      <ScoreCardList />
    </div>
  );
}
