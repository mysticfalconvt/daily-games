import { GameType } from "@/types/types";

// for each game type, return the pretty name
export const getPrettyGameType = (gameType: string) => {
  switch (gameType) {
    case GameType.EMOVI:
      return "eMovie";
    case GameType.FRAMED:
      return "Framed";
    case GameType.WORDLE:
      return "Wordle";
    case GameType.WHERE_TAKEN:
      return "Where Taken";
    case GameType.CONNECTIONS:
      return "Connections";
    case GameType.STRANDS:
      return "Strands";
    case GameType.MINI_CROSSWORD:
      return "Mini Crossword";
    case GameType.TRAVLE_USA:
      return "Travle USA";
    case GameType.BANDLE:
      return "Bandle";
    case GameType.JUMBLIE:
      return "Jumblie";
    case GameType.ENSPELLED:
      return "Enspelled";
    case GameType.COLORFLE:
      return "Colorfle";
    default:
      return "Unknown";
  }
};
