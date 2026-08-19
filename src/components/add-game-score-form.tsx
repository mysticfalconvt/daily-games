"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button, Textarea } from "@nextui-org/react";
import { useFormState } from "react-dom";

import { createGameScoreEntry } from "@/app/actions";
import { InsertGameScoreEntrySchema } from "@/db/schema/game-score-entries";
import { GameType } from "@/types/types";
import { clearGameOpen, peekElapsedSinceOpen } from "@/utils/game-open-tracker";
import { formatDuration } from "@/utils/game-timing";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { getGameType } from "./get-game-type";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

export default function AddGameScoreForm() {
  const router = useRouter();
  const [lastResult, action] = useFormState(createGameScoreEntry, undefined);
  const [gameScore, setGameScore] = React.useState("");
  const [gameType, setGameType] = React.useState("");
  const [gameRating, setGameRating] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [durationMs, setDurationMs] = React.useState<number | null>(null);

  // Trigger router refresh when form is successfully submitted
  React.useEffect(() => {
    if (lastResult?.status === "success") {
      // Mark that a score was submitted (for components that mount after redirect)
      sessionStorage.setItem("scoreSubmitted", Date.now().toString());
      // Dispatch a custom event to trigger refetch in score list components
      window.dispatchEvent(new CustomEvent("scoreSubmitted"));
      router.refresh();
    }
  }, [lastResult, router]);
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      formData.set("gameType", gameType);
      formData.set("rating", String(gameRating));
      formData.set("gameScore", gameScore);
      formData.set("message", message);
      return parseWithZod(formData, { schema: InsertGameScoreEntrySchema });
    },
    onSubmit: () => {
      console.log("submit");
      if (gameType) {
        clearGameOpen(gameType);
      }
      setGameScore("");
      setGameType("");
      setGameRating(0);
      setMessage("");
      setError(null);
      setDurationMs(null);
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });
  form.initialValue = {
    score: gameScore,
    gameType: gameType,
    rating: String(gameRating),
    message: "",
  };

  const handleGameScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = e.target.value;
    setGameScore(newScore);

    const detectedGameType = getGameType(newScore);
    setGameType(detectedGameType);
    setGameRating(getGameRating(newScore));

    // Measured at paste, not at submit: pasting is when the puzzle actually
    // ended. Timing all the way to submit would fold in however long they
    // spent writing a message.
    setDurationMs(
      detectedGameType === GameType.UNKNOWN
        ? null
        : peekElapsedSinceOpen(detectedGameType)
    );

    // Reset error when user starts typing
    setError(null);

    // Validate game type
    if (detectedGameType === GameType.UNKNOWN) {
      setError("Unknown game type. Please paste a valid game score.");
    }
  };

  const detected = gameType && gameType !== GameType.UNKNOWN;

  return (
    <Card className="p-5">
      <form
        id={form.id}
        onSubmit={form.onSubmit}
        action={action}
        noValidate
        // Was a fixed w-80, which made this card narrower than everything
        // around it.
        className="flex w-full flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Add a score</h2>
          {detected ? (
            <div className="flex items-center gap-2">
              {durationMs !== null && (
                // Tells the player their time is about to be posted, so the
                // chip on the feed is not a surprise.
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  ⏱ {formatDuration(durationMs)}
                </span>
              )}
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {getPrettyGameType(gameType)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Paste to detect
            </span>
          )}
        </div>
        <Textarea
          label="Paste your game score"
          key={fields.score.key}
          name={fields.score.name}
          placeholder="e.g. Wordle 1,198 4/6"
          className="w-full"
          value={gameScore}
          isInvalid={!fields.message.valid || !!error}
          errorMessage={error || fields.score.errors}
          onChange={handleGameScoreChange}
        />
        <Input
          name={fields.gameType.name}
          readOnly
          key={fields.gameType.key}
          value={gameType}
          className="hidden"
        />
        <Input
          name={fields.rating.name}
          readOnly
          key={fields.rating.key}
          value={gameRating}
          className="hidden"
          type="number"
        />
        {/* Not a conform field - it is omitted from InsertGameScoreEntrySchema
            and read straight off the form data by the action. */}
        <input
          type="hidden"
          name="durationMs"
          value={durationMs === null ? "" : durationMs}
        />

        <Textarea
          label="Message (optional)"
          name={fields.message.name}
          placeholder="Say something about it..."
          className="w-full"
          minRows={2}
          isInvalid={!fields.message.valid}
          errorMessage={fields.message.errors}
          value={message}
          onChange={(e) => setMessage(e.target.value || "")}
        />

        <Button
          type="submit"
          color="primary"
          className="font-medium"
          isDisabled={gameType === GameType.UNKNOWN}
        >
          Post score
        </Button>
      </form>
    </Card>
  );
}

const getGameRating = (gameScore: string) => {
  const gameType = getGameType(gameScore);
  if (gameType === GameType.UNKNOWN) {
    return 0;
  }
  if (gameType === GameType.MINI_CROSSWORD) {
    // paste is one of two share links, both carrying the time in seconds as t:
    // https://www.nytimes.com/badges/games/mini.html?d=2024-09-29&t=38&c=6e91a31c0d103588059bfc260f2bd1cc&smid=url-share
    // https://www.nytimes.com/shared/v2/mini-xwd.html?d=2026-08-19&t=99&c=d42cf945544bd2f30b9df22bc18b4599&smid=url-share
    // Matched out of the text rather than parsed as a whole URL, since the
    // paste can carry surrounding whitespace or text.
    const urlMatch = gameScore.match(
      /https:\/\/www\.nytimes\.com\/(?:badges\/games\/mini|shared\/v2\/mini-xwd)\.html\?\S+/
    );
    if (urlMatch) {
      const time = new URL(urlMatch[0]).searchParams.get("t");
      if (time && Number(time) > 0) {
        return Number(time);
      }
    }
    if (gameScore.includes("New York Times Mini Crossword")) {
      const timeMatch = gameScore.match(/in\s+(\d+):(\d+)!/);

      const minutes = timeMatch ? parseInt(timeMatch[1], 10) : 0;
      const seconds = timeMatch ? parseInt(timeMatch[2], 10) : 0;

      const totalSeconds = minutes * 60 + seconds;

      return totalSeconds;
    }
    return 0;
  }

  if (gameType === GameType.WORDLE) {
    // paste looks like this:
    // Wordle 1,198 6/6 ⬛🟨🟨🟩⬛ ⬛⬛⬛🟨⬛ ⬛🟨🟨🟩🟨 🟨🟩⬛🟩🟩 ⬛🟩🟩🟩🟩 🟩🟩🟩🟩🟩
    // or
    // Wordle 1,197 5/6 🟨⬛🟨⬛⬛ ⬛⬛⬛🟨⬛ ⬛⬛🟩🟩🟨 ⬛🟩🟩🟩⬛ 🟩🟩🟩🟩🟩
    // what we want is the number before the /6 so in those cases it is 6 or 5
    //  need a regex for this
    const everythingBeforeSlash = gameScore.split("/")[0];
    const lastCharacter =
      everythingBeforeSlash[everythingBeforeSlash.length - 1];
    const numberBeforeSlash = Number(lastCharacter);
    if (numberBeforeSlash > 0) {
      return numberBeforeSlash;
    }
    return 7;
  }

  if (gameType === GameType.STRANDS) {
    // paste looks like this:
    // Strands #210 "Weed 'em and reap" 💡🔵🔵🟡 🔵🔵🔵🔵
    // we need to count the blue circles and yellow circles and then subtract thelight bulbs from the total
    const numberOfBlueCircles = gameScore.split("🔵").length - 1;
    const numberOfYellowCircles = gameScore.split("🟡").length - 1;
    const numberOfLightBulbs = gameScore.split("💡").length - 1;
    const totalScore =
      numberOfBlueCircles + numberOfYellowCircles - numberOfLightBulbs;
    if (totalScore > 0) {
      return totalScore;
    }
    return 0;
  }

  if (gameType === GameType.EMOVI) {
    // paste looks like this:
    // #Emovi 🎬 #806 👩‍👦🗡️⏳🐛🪐 🟥🟥🟩 https://emovi.teuteuf.fr
    // #Emovi 🎬 #809 🥁👨‍🦲⏱️🩸🚗📁🎶🟩⬜⬜ https://emovi.teuteuf.fr
    // we need which number was the  🟩 in one of those it was 3rds after 2 red, in the other it was 2nd after 1 red
    const numberOfRedSquares = gameScore.split("🟥").length - 1;
    return numberOfRedSquares + 1;
  }

  if (gameType === GameType.ENSPELLED) {
    // paste looks like this:
    // Enspelled #153 I solved today's puzzle in 3 words! 🟥🟥🟥🟥   🟥🟥🟥🟥   🟨 View my solution at https://enspelled.com/solution/153+aRROGfe+YGFmfuaZ+eGbqd
    // we need to get the number of words, in this case it is 3 so we are looking to get the character after "today's puzzle "
    const afterPuzzle = gameScore.split("today's puzzle in ")[1];
    const nextCharacter = afterPuzzle[0];
    return Number(nextCharacter);
  }

  if (gameType === GameType.BANDLE) {
    // paste looks like this:
    // Bandle #778 3/6 🟥🟥🟩⬜⬜⬜ Found: 392/399 (98.2%) Current Streak: 9 (max 85) #Bandle #Heardle #Wordle https://bandle.app/

    const everythingBeforeSlash = gameScore.split("/6")[0];
    const lastCharacter =
      everythingBeforeSlash[everythingBeforeSlash.length - 1];
    const numberBeforeSlash = Number(lastCharacter);
    if (numberBeforeSlash > 0) {
      return numberBeforeSlash;
    }
    return 7;
  }

  if (gameType === GameType.JUMBLIE) {
    // paste looks like this:
    // Jumblie #1 🟠🟢🔴🔵 6 guesses in 53s https://jumblie.com
    // Jumblie #364 🔵🔴🟠🟢 4 guesses in 1m 20s https://jumblie.com
    // we need to get the number of guesses, and the time it took
    const guessesMatch = gameScore.match(/(\d+)\s+guesses/);
    const timeMatch = gameScore.match(/(\d+)(m)?\s*(\d*)s/);

    const numberOfGuesses = guessesMatch ? parseInt(guessesMatch[1], 10) : 0;
    let timeInSeconds = 0;

    if (timeMatch) {
      const minutes = timeMatch[2] ? parseInt(timeMatch[1], 10) : 0;
      const seconds = timeMatch[3]
        ? parseInt(timeMatch[3], 10)
        : parseInt(timeMatch[1], 10);
      timeInSeconds = minutes * 60 + seconds;
    }
    return 2 * (numberOfGuesses - 4) + timeInSeconds;
  }

  if (gameType === GameType.COLORFLE) {
    const everythingBeforeSlash = gameScore.split("/6")[0];
    const lastCharacter =
      everythingBeforeSlash[everythingBeforeSlash.length - 1];
    const numberBeforeSlash = Number(lastCharacter);
    if (numberBeforeSlash > 0) {
      return numberBeforeSlash;
    }
    return 7;
  }

  if (gameType === GameType.TRAVLE_USA) {
    // #travle_usa #474 +1 ✅🟧✅✅ https://travle.earth/usa
    //  #travle_usa #472 +0 (Perfect) ✅✅✅✅ https://travle.earth/usa
    //  we need to return the number after the +
    const everythingAfterPlus = gameScore.split("+")[1];

    const numberAfterPlus = Number(everythingAfterPlus[0]);
    if (numberAfterPlus > 0) {
      return numberAfterPlus;
    }
    return 0;
  }

  if (gameType === GameType.CONNECTIONS) {
    // paste looks like this:
    // Connections Puzzle #481 🟨🟨🟨🟨  🟩🟩🟩🟩 🟦🟦🟦🟦 🟪🟪🟪🟪
    const gridMatch = gameScore.match(/(🟨|🟩|🟦|🟪){4}/g);

    const numberOfTries = gridMatch ? gridMatch.length : 0;
    return numberOfTries;
  }

  if (gameType === GameType.WHERE_TAKEN) {
    const triesMatch = gameScore.match(/(\d+)\/6/);
    const starsMatch = gameScore.match(/(⭐+)/);

    const numberOfTries = triesMatch ? parseInt(triesMatch[1], 10) : 0;
    const numberOfStars = starsMatch ? starsMatch[1].length : 0;
    return numberOfStars + 6 - numberOfTries;
  }

  if (gameType === GameType.FRAMED) {
    // this one just needs to count the number of red squares and add 1 and return that
    const numberOfRedSquares = gameScore.split("🟥").length - 1;
    return numberOfRedSquares + 1;
  }

  if (gameType === GameType.PIPS) {
    // paste looks like this: Pips #3 Hard 🔴\n3:40
    // we want to extract the time in seconds (3:40 = 220 seconds)
    const timeMatch = gameScore.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  if (gameType === GameType.SCRANDLE) {
    // paste looks like this: 🟥🟥🟩🟩🟥🟩🟩🟩🟩🟩 7/10 | 2025-08-20 | https://scrandle.com
    // we want to extract the X from X/10, handling both single digits and 10/10
    const scoreMatch = gameScore.match(/(\d+)\/10/);
    if (scoreMatch) {
      return parseInt(scoreMatch[1], 10);
    }
    return 0;
  }

  return 0;
};
