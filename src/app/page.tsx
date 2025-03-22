import { Card, CardBody } from "@nextui-org/react";
import { and, gte, lt } from "drizzle-orm";
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

  // Get date from 7 days ago
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Fetch all games played today and in the last week
  const [allGamesToday, allGamesLastWeek] = await Promise.all([
    db.query.gameScoreEntries.findMany({
      where: gte(gameScoreEntries.createdAt, today),
      columns: {
        gameType: true,
        rating: true,
        userId: true,
      },
    }),
    db.query.gameScoreEntries.findMany({
      where: and(
        gte(gameScoreEntries.createdAt, lastWeek),
        lt(gameScoreEntries.createdAt, today)
      ),
      columns: {
        gameType: true,
        rating: true,
        userId: true,
      },
    }),
  ]);

  // Helper function to determine wins for a set of games
  const calculateWins = (games: typeof allGamesToday) => {
    // Group scores by game type
    const scoresByGame = games.reduce(
      (acc, game) => {
        if (!acc[game.gameType]) {
          acc[game.gameType] = [];
        }
        acc[game.gameType].push({
          userId: game.userId,
          rating: Number(game.rating),
        });
        return acc;
      },
      {} as Record<string, { userId: string; rating: number }[]>
    );

    // Determine wins for each game type
    const winsByGame = Object.entries(scoresByGame).reduce(
      (acc, [gameType, scores]) => {
        // Skip games with only one player
        if (scores.length <= 1) return acc;

        // Sort scores based on rating order
        const sortedScores = [...scores].sort((a, b) => {
          // For games where lower is better (LOWEST_FIRST)
          if (
            gameType === "WORDLE" ||
            gameType === "COLORFLE" ||
            gameType === "BANDLE" ||
            gameType === "MINI_CROSSWORD" ||
            gameType === "STRANDS" ||
            gameType === "EMOVI" ||
            gameType === "FRAMED" ||
            gameType === "ENSPELLED" ||
            gameType === "JUMBLIE" ||
            gameType === "TRAVLE_USA" ||
            gameType === "CONNECTIONS"
          ) {
            return a.rating - b.rating;
          }
          // For games where higher is better (HIGHEST_FIRST)
          return b.rating - a.rating;
        });

        // Get the best score
        const bestScore = sortedScores[0].rating;

        // Count how many players tied for the best score
        const winners = sortedScores.filter(
          (score) => score.rating === bestScore
        );

        acc[gameType] = winners;
        return acc;
      },
      {} as Record<string, { userId: string; rating: number }[]>
    );

    return {
      winsByGame,
    };
  };

  // Calculate wins for today and last week
  const { winsByGame: todayWinsByGame } = calculateWins(allGamesToday);
  const { winsByGame: lastWeekWinsByGame } = calculateWins(allGamesLastWeek);

  // Get the current user's played games and their win status for today
  const userPlayedGames = allGamesToday
    .filter((game) => game.userId === session.user.id)
    .map((game) => ({
      gameType: game.gameType,
      rating: Number(game.rating),
      isWin:
        todayWinsByGame[game.gameType]?.some(
          (winner) => winner.userId === session.user.id
        ) ?? false,
    }));

  // Get the current user's played games and their win status for last week
  const userPlayedGamesLastWeek = allGamesLastWeek
    .filter((game) => game.userId === session.user.id)
    .map((game) => ({
      gameType: game.gameType,
      rating: Number(game.rating),
      isWin:
        lastWeekWinsByGame[game.gameType]?.some(
          (winner) => winner.userId === session.user.id
        ) ?? false,
    }));

  const playedGameTypes = userPlayedGames.map((game) => game.gameType);

  // Calculate win ratios
  const todayWinsCount = userPlayedGames.filter((game) => game.isWin).length;
  const todayTotal = userPlayedGames.length;
  const todayRatio = todayTotal > 0 ? `${todayWinsCount}/${todayTotal}` : "0/0";

  const lastWeekWinsCount = userPlayedGamesLastWeek.filter(
    (game) => game.isWin
  ).length;
  const lastWeekTotal = userPlayedGamesLastWeek.length;
  const lastWeekRatio =
    lastWeekTotal > 0 ? `${lastWeekWinsCount}/${lastWeekTotal}` : "0/0";

  return (
    <div className="flex min-h-screen flex-col items-center justify-start gap-2">
      <Card className="mx-auto mt-4 max-w-md">
        <CardBody className="text-center">
          <h1 className="text-5xl">Daily Game Scores</h1>
          <p className="text-xl">A place to share your scores</p>
        </CardBody>
      </Card>
      <AvailableGamesList
        playedGames={playedGameTypes}
        lastWeekStats={{
          wins: lastWeekWinsCount,
          total: lastWeekTotal,
          ratio: lastWeekRatio,
        }}
        todayStats={{
          wins: todayWinsCount,
          total: todayTotal,
          ratio: todayRatio,
        }}
      />
      <AddGameScoreForm />
      <ScoreCardList />
    </div>
  );
}
