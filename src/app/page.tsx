import { and, gte, inArray, lt } from "drizzle-orm";

import AddGameScoreForm from "@/components/add-game-score-form";
import AvailableGamesList from "@/components/available-games-list";
import { ScoreCardList } from "@/components/score-card-list";
import db from "@/db";
import gameScoreEntries from "@/db/schema/game-score-entries";
import { getAuthContext } from "@/lib/auth-context";
import { VisibilityService } from "@/services/visibility-service";

export default async function Home() {
  // This page is the sign-in destination, so it must handle anonymous visitors
  // itself. `requireUser()` redirects here, which on this route is a redirect
  // loop.
  const context = await getAuthContext();

  if (!context) {
    return (
      <div className="app-container flex flex-col items-center gap-6 py-20 text-center">
        <span
          aria-hidden
          className="grid grid-cols-2 gap-1 rounded-2xl bg-primary/10 p-3"
        >
          <span className="h-5 w-5 rounded-md bg-primary" />
          <span className="h-5 w-5 rounded-md bg-primary/30" />
          <span className="h-5 w-5 rounded-md bg-primary/30" />
          <span className="h-5 w-5 rounded-md bg-primary" />
        </span>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Daily Game Scores
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Share your Wordle, Connections and Strands results with friends, and
            see who actually won today.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Use <span className="font-medium text-foreground">Sign in</span> above
          to get started.
        </p>
      </div>
    );
  }

  const { user } = context;

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get date from 7 days ago
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Wins are decided against the scores this user is actually allowed to see.
  // This used to query every score in the table, so a private stranger's result
  // could silently cost you a win you had no way to look up.
  const visibleUserIds = await VisibilityService.getVisibleScoreOwnerIds(
    user.id
  );

  const [allGamesToday, allGamesLastWeek] = await Promise.all([
    db.query.gameScoreEntries.findMany({
      where: and(
        gte(gameScoreEntries.createdAt, today),
        inArray(gameScoreEntries.userId, visibleUserIds)
      ),
      columns: {
        gameType: true,
        rating: true,
        userId: true,
      },
    }),
    db.query.gameScoreEntries.findMany({
      where: and(
        gte(gameScoreEntries.createdAt, lastWeek),
        lt(gameScoreEntries.createdAt, today),
        inArray(gameScoreEntries.userId, visibleUserIds)
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
    .filter((game) => game.userId === user.id)
    .map((game) => ({
      gameType: game.gameType,
      rating: Number(game.rating),
      isWin:
        todayWinsByGame[game.gameType]?.some(
          (winner) => winner.userId === user.id
        ) ?? false,
    }));

  // Get the current user's played games and their win status for last week
  const userPlayedGamesLastWeek = allGamesLastWeek
    .filter((game) => game.userId === user.id)
    .map((game) => ({
      gameType: game.gameType,
      rating: Number(game.rating),
      isWin:
        lastWeekWinsByGame[game.gameType]?.some(
          (winner) => winner.userId === user.id
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
    // One container width for every section. The header, games panel, form and
    // feed each used to set their own max-width, which made the column ragged.
    <div className="app-container flex flex-col gap-6 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Daily Game Scores
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Post today&apos;s results and see how your friends did.
        </p>
      </header>

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
