import { getServerSession } from "next-auth";

import options from "@/config/auth";
import db from "@/db";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { Card } from "./ui/card";

export const ByGameScoreList = async () => {
  const listOfScores = await db.query.gameScoreEntries.findMany({
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
  });
  const session = (await getServerSession(options))!;
  if (!session?.user) {
    return null;
  }

  const scoresByGameType = listOfScores.reduce(
    (acc, score) => {
      if (!acc[score.gameType]) {
        acc[score.gameType] = [];
      }
      acc[score.gameType].push(score);
      return acc;
    },
    {} as Record<string, typeof listOfScores>
  );

  const listOfScoresByGameType = Object.keys(scoresByGameType).map(
    (gameType) => {
      const scores = scoresByGameType[gameType];
      const averageScore =
        scores.reduce((acc, score) => {
          return acc + parseFloat(score.rating);
        }, 0) / scores.length;
      const thisUsersLatestScore = scores.find(
        (score) => score.user?.id === session.user.id
      );

      return {
        gameType,
        scores,
        averageScore,
        thisUsersLatestScore,
      };
    }
  );
  console.log(listOfScoresByGameType);

  return (
    <div className="flex flex-col gap-1">
      {listOfScoresByGameType?.map((score) => {
        // const isBetterThanAverage =
        //   score.thisUsersLatestScore?.rating > score.averageScore;
        // console.log(isBetterThanAverage);

        return (
          <Card
            key={score.gameType}
            className="max-w-sm break-words p-2 xl:max-w-lg"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {getPrettyGameType(score.gameType)}
              </h2>
            </div>
            <h2 className="text-2xl font-bold">
              Average Score: {score.averageScore.toFixed(2)} for the last 7 days
            </h2>
            <h2 className="text-2xl font-bold">
              Your Score: {score.thisUsersLatestScore?.rating}
            </h2>
            {/* {score.scores.map((score) => (
            <div key={score.id} className="flex items-center gap-2">
              <Avatar
                className="h-8 w-8 transition-transform"
                showFallback={!score.user?.image}
                src={score.user?.image || ""}
              />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {score.user?.name}
                </p>
                <p className="text-xs text-muted-foreground">{score.message}</p>
              </div>
              <p className="text-sm font-medium">{score.score}</p>
            </div>
          ))} */}
          </Card>
        );
      })}
    </div>
  );
};
