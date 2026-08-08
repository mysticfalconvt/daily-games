import { ByGameScoreList } from "@/components/by-game-score-list";
import { requireUser } from "@/lib/auth-context";

export default async function Home() {
  await requireUser();

  return (
    <div className="app-container flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">By game</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Averages across everyone you can see, over the last 7 days.
        </p>
      </header>
      <ByGameScoreList />
    </div>
  );
}
