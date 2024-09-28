"use client";

import * as React from "react";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button, Textarea } from "@nextui-org/react";
import { useFormState } from "react-dom";

import { createGameScoreEntry } from "@/app/actions";
import { InsertGameScoreEntrySchema } from "@/db/schema/game-score-entries";
import { GameType } from "@/types/types";

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
      formData.set("rating", gameRating);
      console.log(
        parseWithZod(formData, { schema: InsertGameScoreEntrySchema })
      );
      return parseWithZod(formData, { schema: InsertGameScoreEntrySchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });
  form.initialValue = {
    score: gameScore,
    gameType: gameType,
    rating: gameRating,
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
        <Textarea
          label="Paste Game Score here"
          key={fields.score.key}
          name={fields.score.name}
          placeholder="Enter your message"
          className="w-full"
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

const getGameType = (gameScore: string) => {
  // This will have to handle many pastsed entries and tell what game they are from the entry.
  // Here is an example for Framed
  //   Framed #931
  // 🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛
  // https://framed.wtf

  if (gameScore.includes("https://framed.wtf")) {
    return GameType.FRAMED;
  }

  return "EMOVIE";
};

const getGameRating = (gameScore: string) => {
  if (gameScore.includes("⭐️")) {
    return 1;
  }
  return 5;
};
