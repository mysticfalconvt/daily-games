"use client";

import * as React from "react";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button, Textarea } from "@nextui-org/react";
import { useFormState } from "react-dom";

import { createGameScoreEntry } from "@/app/actions";
import { InsertGameScoreEntrySchema } from "@/db/schema/game-score-entries";
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
  if (gameType === "UNKNOWN") {
    return 0;
  }
  if (gameScore.includes("⭐️")) {
    return 1;
  }
  return 5;
};
