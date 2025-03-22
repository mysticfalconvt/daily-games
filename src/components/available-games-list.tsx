"use client";

import { GameType } from "@/types/types";
import { getGameUrl } from "@/utils/get-game-url";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { Card } from "./ui/card";

interface AvailableGamesListProps {
  playedGames: string[];
}

export default function AvailableGamesList({
  playedGames,
}: AvailableGamesListProps) {
  // Get all game types except UNKNOWN
  const allGameTypes = Object.values(GameType).filter(
    (type) => type !== GameType.UNKNOWN
  );

  // Filter out games that have been played today
  const availableGames = allGameTypes.filter(
    (gameType) => !playedGames.includes(gameType)
  );

  if (availableGames.length === 0) {
    return (
      <Card className="mb-4 p-4">
        <p className="text-fg-600 text-center">
          You&apos;ve played all available games today! 🎉
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4 p-4">
      <h3 className="mb-2 text-center text-lg font-semibold">
        Games Available Today
      </h3>
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
