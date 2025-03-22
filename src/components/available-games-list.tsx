"use client";

import { GameType } from "@/types/types";
import { getGameUrl } from "@/utils/get-game-url";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { Card } from "./ui/card";

interface PlayedGame {
  gameType: string;
  rating: number;
  isWin: boolean;
}

interface LastWeekStats {
  wins: number;
  total: number;
  ratio: string;
}

interface AvailableGamesListProps {
  playedGames: string[];
  playedGamesWithRatings: PlayedGame[];
  lastWeekStats: LastWeekStats;
}

export default function AvailableGamesList({
  playedGames,
  playedGamesWithRatings,
  lastWeekStats,
}: AvailableGamesListProps) {
  // Get all game types except UNKNOWN
  const allGameTypes = Object.values(GameType).filter(
    (type) => type !== GameType.UNKNOWN
  );

  // Filter out games that have been played today
  const availableGames = allGameTypes.filter(
    (gameType) => !playedGames.includes(gameType)
  );

  // Calculate win ratio for today
  const wins = playedGamesWithRatings.filter((game) => game.isWin).length;
  const winRatio =
    playedGames.length > 0 ? `${wins}/${playedGames.length}` : "0/0";

  if (availableGames.length === 0) {
    return (
      <Card className="mb-4 p-4">
        <p className="text-fg-600 text-center">
          You&apos;ve played all available games today! 🎉
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-fg-600 text-center">Today: {winRatio}</p>
          <p className="text-fg-600 text-center">
            Last Week: {lastWeekStats.ratio}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 p-4">
      <h3 className="mb-2 text-center text-lg font-semibold">
        Games Available Today
      </h3>
      <div className="mb-4 space-y-1">
        <p className="text-fg-600 text-center">Today: {winRatio}</p>
        <p className="text-fg-600 text-center">
          Last Week: {lastWeekStats.ratio}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {availableGames.map((gameType) => (
          <a
            key={gameType}
            href={getGameUrl(gameType)}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-md bg-accent/20 p-2 text-center transition-colors hover:bg-accent/30"
          >
            {getPrettyGameType(gameType)}
          </a>
        ))}
      </div>
    </Card>
  );
}
