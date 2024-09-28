import { Card, CardBody } from "@nextui-org/react";

import AddGameScoreForm from "@/components/add-game-score-form";
import { ScoreCardList } from "@/components/score-card-list";

export default async function Home() {
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
