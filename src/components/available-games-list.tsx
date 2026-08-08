"use client";

import { IconExternalLink } from "@tabler/icons-react";

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/60 px-3 py-2">
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
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

  const playedAll = availableGames.length === 0;

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Today&apos;s games</h2>
          <p className="text-sm text-muted-foreground">
            {playedAll
              ? "You've played everything today."
              : `${availableGames.length} still to play`}
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Today" value={todayStats.ratio} />
          <Stat label="Last week" value={lastWeekStats.ratio} />
        </div>
      </div>

      {playedAll ? (
        <p className="mt-4 rounded-lg bg-success/10 px-3 py-4 text-center text-sm font-medium text-success">
          🎉 Every game played — nice work.
        </p>
      ) : (
        // Pills that read as links. These were bare text with a broken
        // `bg--foreground` class, so nothing signalled they were clickable.
        <div className="mt-4 flex flex-wrap gap-2">
          {availableGames.map((gameType) => (
            <a
              key={gameType}
              href={getGameUrl(gameType)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {getPrettyGameType(gameType)}
              <IconExternalLink
                size={14}
                className="text-muted-foreground transition-colors group-hover:text-primary"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
