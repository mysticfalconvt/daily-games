import { Card, CardBody } from "@nextui-org/react";
import { getServerSession } from "next-auth";

import AddGameScoreForm from "@/components/add-game-score-form";
import { ScoreCardList } from "@/components/score-card-list";
import options from "@/config/auth";

export default async function Home() {
  const session = (await getServerSession(options))!;
  if (!session?.user) {
    return null;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-start gap-2">
      <Card className="mx-auto mt-4 max-w-md">
        <CardBody className="text-center">
          <h1 className="text-5xl">Daily Game Scores</h1>
          <p className="text-xl">A place to share your scores</p>
        </CardBody>
      </Card>
      <AddGameScoreForm />
      <ScoreCardList />
    </div>
  );
}
