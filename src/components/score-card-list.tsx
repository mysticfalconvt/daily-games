import { Avatar } from "@nextui-org/react";

import db from "@/db";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { Card } from "./ui/card";

export const ScoreCardList = async () => {
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
  return (
    <div className="flex flex-col gap-1">
      {listOfScores?.map((score) => (
        <Card key={score.id} className="max-w-lg break-words p-2">
          <div className="flex items-center gap-2">
            <Avatar
              className="h-8 w-8 transition-transform"
              showFallback={!score.user?.image}
              src={score.user?.image || ""}
              fallback={score.user?.name}
            />
            <h2 className="text-2xl font-bold">{score.user.name}</h2>
          </div>
          <h2 className="text-2xl font-bold">
            {getPrettyGameType(score.gameType)} - {score.rating}
          </h2>
          <p className="whitespace-pre-wrap text-lg font-bold">{score.score}</p>
          <p className="text-lg">{score.message}</p>
        </Card>
      ))}
    </div>
  );
};
