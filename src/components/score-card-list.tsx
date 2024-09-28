import db from "@/db";

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
    <div className="flex flex-col">
      {listOfScores?.map((score) => (
        <Card key={score.id}>
          <h2 className="text-2xl font-bold">{score.user.name}</h2>
          <p className="text-lg font-bold">{score.score}</p>
          <p className="text-lg">{score.message}</p>
        </Card>
      ))}
    </div>
  );
};
