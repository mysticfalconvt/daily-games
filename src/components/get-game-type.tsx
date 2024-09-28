"use client";

import { GameType } from "@/types/types";

export const getGameType = (gameScore: string) => {
  // This will have to handle many pastsed entries and tell what game they are from the entry.
  // Here is an example for Framed
  //   Framed #931
  // 🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛
  // https://framed.wtf

  // this need to be a switch that returns the game type and included every game type for GameType.
  // It also needs to check that every option in GameType is handled

  if (gameScore.includes("Wordle") && !gameScore.includes("Bandle")) {
    return GameType.WORDLE;
  }
  if (gameScore.includes("#WhereTaken")) {
    return GameType.WHERE_TAKEN;
  }
  if (gameScore.includes("Connections")) {
    return GameType.CONNECTIONS;
  }
  if (gameScore.includes("Strands")) {
    return GameType.STRANDS;
  }
  if (gameScore.includes("Mini Crossword")) {
    return GameType.MINI_CROSSWORD;
  }

  if (gameScore.includes("https://framed.wtf")) {
    return GameType.FRAMED;
  }

  if (gameScore.includes("Emovi")) {
    return GameType.EMOVI;
  }

  if (gameScore.includes("#travle_usa")) {
    return GameType.TRAVLE_USA;
  }
  if (gameScore.includes("Bandle #")) {
    return GameType.BANDLE;
  }

  if (gameScore.includes("https://jumblie.com")) {
    return GameType.JUMBLIE;
  }

  if (gameScore.includes("Enspelled #")) {
    return GameType.ENSPELLED;
  }

  return GameType.UNKNOWN;
};
