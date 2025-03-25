import { Avatar } from "@nextui-org/react";
import { getServerSession } from "next-auth";

import options from "@/config/auth";
import db from "@/db";
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
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string;
  };
};

type GroupedScores = {
  [date: string]: {
    [gameType: string]: ScoreEntry[];
  };
};

export const ScoreCardList = async () => {
  const listOfScores = (await db.query.gameScoreEntries.findMany({
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt);
    },

    where(fields, operators) {
      //    only get created in the last week
      return operators.gte(
        fields.createdAt,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
    },
    with: {
      user: true,
    },
  })) as ScoreEntry[];

  const session = (await getServerSession(options))!;
  if (!session?.user) {
    return null;
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
    <div className="flex flex-col gap-4">
      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-4">
          <h1 className="text-shadow-black/80 inline-block rounded-lg bg-accent/40 px-4 py-1 text-3xl font-bold text-shadow-lg">
            {date === today ? "Today" : date}
          </h1>
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
                <Card
                  key={gameType}
                  className="max-w-sm break-words p-4 xl:max-w-lg"
                >
                  <h2 className="mb-4 text-2xl font-bold">
                    {getPrettyGameType(gameType)}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {sortedScores.map((score) => (
                      <div
                        key={score.id}
                        className={`flex flex-col gap-2 border-t pt-2 ${
                          score.user.id === session.user.id
                            ? "rounded-lg bg-accent/40 p-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            className="h-8 w-8 transition-transform"
                            showFallback={!score.user?.image}
                            src={score.user?.image || ""}
                            fallback={score.user?.name}
                          />
                          <h2 className="text-xl font-bold">
                            {score.user.name}
                          </h2>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/40 text-lg font-bold">
                            {score.rating}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="whitespace-pre-wrap text-lg">
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
                            <p className="text-lg text-gray-600">
                              {score.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
        </div>
      ))}
    </div>
  );
};
