"use client";

import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@nextui-org/react";
import { useSession } from "next-auth/react";

import { ViewToggle } from "@/components/friends/view-toggle";
import { ScoreInteractions } from "@/components/interactions/score-interactions";
import { GAME_RATING_ORDER, GameType, RatingOrder } from "@/types/types";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";
import { getPrettyScore } from "@/utils/get-pretty-score";

import { Card } from "./ui/card";

type ScoreEntry = {
  id: string;
  userId: string;
  createdAt: Date;
  gameType: string;
  rating: string;
  score: string;
  message: string | null;
  // The feed no longer ships author emails - see PUBLIC_USER_COLUMNS.
  user: {
    id: string;
    name: string | null;
    image: string;
  };
};

type GroupedScores = {
  [date: string]: {
    [gameType: string]: ScoreEntry[];
  };
};

export const ScoreCardList = () => {
  const { data: session } = useSession();
  const [listOfScores, setListOfScores] = useState<ScoreEntry[]>([]);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [hasFriends, setHasFriends] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/scores/weekly?friendsOnly=${friendsOnly}&t=${Date.now()}`
      );
      if (response.ok) {
        const data = await response.json();
        setListOfScores(data.scores as ScoreEntry[]);
        setHasFriends(data.hasFriends);
      } else {
        console.error("Failed to fetch scores");
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, friendsOnly]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Listen for score submission events to refetch
  useEffect(() => {
    const handleScoreSubmitted = () => {
      fetchScores();
    };

    // Check if a score was submitted (handles page reload after redirect)
    const scoreSubmitted = sessionStorage.getItem("scoreSubmitted");
    if (scoreSubmitted) {
      sessionStorage.removeItem("scoreSubmitted");
      fetchScores();
    }

    window.addEventListener("scoreSubmitted", handleScoreSubmitted);
    return () => {
      window.removeEventListener("scoreSubmitted", handleScoreSubmitted);
    };
  }, [fetchScores]);

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      // Skeleton now uses theme tokens. It was a hard-coded light grey, which
      // glowed against the dark theme.
      <div className="flex animate-pulse flex-col gap-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
    );
  }

  // Group scores by date and game type
  const groupedScores: GroupedScores = {};
  listOfScores.forEach((score) => {
    const date = new Date(score.createdAt).toLocaleDateString();
    if (!groupedScores[date]) {
      groupedScores[date] = {};
    }
    if (!groupedScores[date][score.gameType]) {
      groupedScores[date][score.gameType] = [];
    }
    groupedScores[date][score.gameType].push(score);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedScores).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Get today's date in the same format as the grouped scores
  const today = new Date().toLocaleDateString();

  return (
    <div className="flex flex-col gap-8">
      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-4">
          {/* A ruled section header. This was a translucent bar that ran past
              the cards and read as a rendering glitch. */}
          <div className="flex items-center gap-3">
            <h2 className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {date === today ? "Today" : date}
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          {Object.values(GameType)
            .sort((a, b) => {
              // Get the user's most recent score for each game type
              const userScoresA = groupedScores[date][a]
                ?.filter((score) => score.user.id === session.user.id)
                ?.sort(
                  (score1, score2) =>
                    new Date(score2.createdAt).getTime() -
                    new Date(score1.createdAt).getTime()
                );
              const userScoresB = groupedScores[date][b]
                ?.filter((score) => score.user.id === session.user.id)
                ?.sort(
                  (score1, score2) =>
                    new Date(score2.createdAt).getTime() -
                    new Date(score1.createdAt).getTime()
                );

              // If user has played both games, sort by most recent
              if (userScoresA?.length && userScoresB?.length) {
                return (
                  new Date(userScoresB[0].createdAt).getTime() -
                  new Date(userScoresA[0].createdAt).getTime()
                );
              }
              // If user has only played one game, it should come first
              if (userScoresA?.length) return -1;
              if (userScoresB?.length) return 1;
              // If user hasn't played either game, sort alphabetically
              return getPrettyGameType(a).localeCompare(getPrettyGameType(b));
            })
            .map((gameType) => {
              const scores = groupedScores[date][gameType];
              if (!scores?.length) return null;

              // Sort scores based on game type's rating order
              const sortedScores = [...scores].sort((a, b) => {
                const ratingOrder = GAME_RATING_ORDER[gameType as GameType];
                const ratingA = parseInt(a.rating);
                const ratingB = parseInt(b.rating);

                if (ratingOrder === RatingOrder.HIGHEST_FIRST) {
                  return ratingB - ratingA;
                } else {
                  return ratingA - ratingB;
                }
              });

              return (
                // Full container width, so every card lines up. These were
                // max-w-sm while their neighbours were wider.
                <Card key={gameType} className="w-full break-words">
                  <h3 className="border-b px-5 py-3 text-base font-semibold">
                    {getPrettyGameType(gameType)}
                  </h3>
                  <div className="flex flex-col divide-y">
                    {sortedScores.map((score) => (
                      <div
                        key={score.id}
                        className={`flex flex-col gap-2 px-5 py-4 ${
                          score.user.id === session.user.id
                            ? "bg-primary/[0.06]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            className="h-7 w-7 shrink-0"
                            showFallback={!score.user?.image}
                            src={score.user?.image || ""}
                            fallback={score.user?.name}
                          />
                          <h4 className="flex-1 truncate text-sm font-semibold">
                            {score.user.name}
                            {score.user.id === session.user.id && (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                you
                              </span>
                            )}
                          </h4>
                          <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground">
                            {score.rating}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="whitespace-pre-wrap text-base leading-relaxed">
                            {(() => {
                              const prettyScore = getPrettyScore(
                                gameType as GameType,
                                score.score
                              );
                              if (
                                gameType === GameType.ENSPELLED &&
                                prettyScore.includes("[link]")
                              ) {
                                const [boxes, link] =
                                  prettyScore.split("[link]");
                                return (
                                  <>
                                    {boxes}{" "}
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                      link
                                    </a>
                                  </>
                                );
                              }
                              return prettyScore;
                            })()}
                          </p>
                          {score.message && (
                            // Was a fixed mid-grey, near-invisible in dark mode.
                            <p className="text-sm text-muted-foreground">
                              {score.message}
                            </p>
                          )}
                        </div>

                        {/* Score Interactions */}
                        <ScoreInteractions
                          scoreId={score.id}
                          currentUserId={session.user.id}
                          scoreOwnerId={score.userId}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
        </div>
      ))}
      <ViewToggle
        friendsOnly={friendsOnly}
        onToggle={setFriendsOnly}
        hasFriends={hasFriends}
      />
    </div>
  );
};
