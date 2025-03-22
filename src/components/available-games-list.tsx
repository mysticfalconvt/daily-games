"use client";

import { Card, CardBody } from "@nextui-org/react";

import { GameType } from "@/types/types";
import { getGameUrl } from "@/utils/get-game-url";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

interface LastWeekStats {
  wins: number;
  total: number;
  ratio: string;
}

interface AvailableGamesListProps {
  playedGames: string[];
  lastWeekStats: LastWeekStats;
  todayStats: LastWeekStats;
}

export default function AvailableGamesList({
  playedGames,
  lastWeekStats,
  todayStats,
}: AvailableGamesListProps) {
  const availableGames = Object.values(GameType).filter(
    (gameType) =>
      gameType !== GameType.UNKNOWN && !playedGames.includes(gameType)
  );

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardBody className="text-center">
        <h2 className="text-2xl">Available Games</h2>
        <p>You won {todayStats.ratio} games that you played today</p>
        {playedGames.length === Object.values(GameType).length - 1 ? (
          <p>You&apos;ve played all games today!</p>
        ) : null}
        <p className="text-sm text-gray-500">
          Last week you won {lastWeekStats.ratio} games
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {availableGames.map((gameType) => (
            <a
              key={gameType}
              href={getGameUrl(gameType)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg--foreground rounded-lg px-4 py-2 text-primary hover:bg-accent-foreground/90 hover:text-primary-foreground"
            >
              {getPrettyGameType(gameType)}
            </a>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
