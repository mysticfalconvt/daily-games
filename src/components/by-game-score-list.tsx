"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { ViewToggle } from "@/components/friends/view-toggle";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { Card } from "./ui/card";

export const ByGameScoreList = () => {
  const { data: session } = useSession();
  const [listOfScores, setListOfScores] = useState<Array<{
    id: string;
    gameType: string;
    rating: string;
    user?: { id: string; name?: string; image?: string };
  }>>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [hasFriends, setHasFriends] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/scores/weekly?showAllUsers=${showAllUsers}`);
        if (response.ok) {
          const data = await response.json();
          setListOfScores(data.scores);
          setHasFriends(data.hasFriends);
        } else {
          console.error("Failed to fetch scores");
        }
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [session?.user?.id, showAllUsers]);

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
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
      <ViewToggle
        showAllUsers={showAllUsers}
        onToggle={setShowAllUsers}
        hasFriends={hasFriends}
      />
    </div>
  );
};
