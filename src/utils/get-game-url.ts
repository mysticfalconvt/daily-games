import { GameType } from "@/types/types";

export function getGameUrl(gameType: GameType): string {
  switch (gameType) {
    case GameType.EMOVI:
      return "https://emovi.teuteuf.fr/";
    case GameType.WORDLE:
      return "https://www.nytimes.com/games/wordle";
    case GameType.FRAMED:
      return "https://framed.wtf/";
    case GameType.CONNECTIONS:
      return "https://www.nytimes.com/games/connections";
    case GameType.MINI_CROSSWORD:
      return "https://www.nytimes.com/crosswords/game/mini";
    case GameType.STRANDS:
      return "https://www.nytimes.com/games/strands";
    case GameType.COLORFLE:
      return "https://colorfle.com/";
    case GameType.JUMBLIE:
      return "https://jumblie.com/";
    case GameType.ENSPELLED:
      return "https://enspelled.com/";
    case GameType.BANDLE:
      return "https://bandle.app/";
    case GameType.TRAVLE_USA:
      return "https://travle.earth/usa";
    case GameType.WHERE_TAKEN:
      return "https://wheretakenusa.teuteuf.fr/";
    case GameType.PIPS:
      return "https://www.nytimes.com/games/pips/hard";
    case GameType.SCRANDLE:
      return "https://scrandle.com/";
    default:
      return "#";
  }
}
