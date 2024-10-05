"use client";

import * as React from "react";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button, Textarea } from "@nextui-org/react";
import { useFormState } from "react-dom";

import { createGameScoreEntry } from "@/app/actions";
import { InsertGameScoreEntrySchema } from "@/db/schema/game-score-entries";
import { GameType } from "@/types/types";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

import { getGameType } from "./get-game-type";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

export default function AddGameScoreForm() {
  const [lastResult, action] = useFormState(createGameScoreEntry, undefined);
  const [gameScore, setGameScore] = React.useState("");
  const [gameType, setGameType] = React.useState("");
  const [gameRating, setGameRating] = React.useState(0);
  const [message, setMessage] = React.useState("");
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
      setGameScore("");
      setGameType("");
      setGameRating(0);
      setMessage("");
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

  return (
    <Card className="p-4">
      <form
        id={form.id}
        onSubmit={form.onSubmit}
        action={action}
        noValidate
        className="mt-4 flex w-80 flex-col gap-2"
      >
        <p className="text-fg-600 text-center text-medium">
          Game: {getPrettyGameType(gameType)}
        </p>
        <Textarea
          label="Paste Game Score here"
          key={fields.score.key}
          name={fields.score.name}
          placeholder="Enter your message"
          className="w-full"
          value={gameScore}
          isInvalid={!fields.message.valid}
          errorMessage={fields.score.errors}
          onChange={(e) => {
            setGameScore(e.target.value);
            setGameType(getGameType(e.target.value));
            setGameRating(getGameRating(e.target.value));
          }}
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

        <Textarea
          label="Message (optional)"
          name={fields.message.name}
          placeholder="Enter your message"
          className="w-full"
          isInvalid={!fields.message.valid}
          errorMessage={fields.message.errors}
          value={message}
          onChange={(e) => setMessage(e.target.value || "")}
        />

        <Button type="submit">Create</Button>
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
    // paste looks like this:
    // https://www.nytimes.com/badges/games/mini.html?d=2024-09-29&t=38&c=6e91a31c0d103588059bfc260f2bd1cc&smid=url-share
    // we need to get the time from the url in this case it is t=38
    const url = new URL(gameScore);
    const time = url.searchParams.get("t");
    if (time) {
      return Number(time);
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
    // Strands #210 “Weed 'em and reap” 💡🔵🔵🟡 🔵🔵🔵🔵
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

  return 0;
};
