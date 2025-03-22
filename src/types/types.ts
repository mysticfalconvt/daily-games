export enum RatingOrder {
  HIGHEST_FIRST = "HIGHEST_FIRST",
  LOWEST_FIRST = "LOWEST_FIRST",
}

export enum GameType {
  EMOVI = "EMOVI",
  FRAMED = "FRAMED",
  WORDLE = "WORDLE",
  WHERE_TAKEN = "WHERE_TAKEN",
  CONNECTIONS = "CONNECTIONS",
  COLORFLE = "COLORFLE",
  STRANDS = "STRANDS",
  MINI_CROSSWORD = "MINI_CROSSWORD",
  TRAVLE_USA = "TRAVLE_USA",
  BANDLE = "BANDLE",
  JUMBLIE = "JUMBLIE",
  ENSPELLED = "ENSPELLED",
  UNKNOWN = "UNKNOWN",
}

export const GAME_RATING_ORDER: Record<GameType, RatingOrder> = {
  [GameType.EMOVI]: RatingOrder.LOWEST_FIRST,
  [GameType.FRAMED]: RatingOrder.LOWEST_FIRST,
  [GameType.WORDLE]: RatingOrder.LOWEST_FIRST,
  [GameType.WHERE_TAKEN]: RatingOrder.HIGHEST_FIRST,
  [GameType.CONNECTIONS]: RatingOrder.LOWEST_FIRST,
  [GameType.COLORFLE]: RatingOrder.LOWEST_FIRST,
  [GameType.STRANDS]: RatingOrder.LOWEST_FIRST,
  [GameType.MINI_CROSSWORD]: RatingOrder.LOWEST_FIRST,
  [GameType.TRAVLE_USA]: RatingOrder.LOWEST_FIRST,
  [GameType.BANDLE]: RatingOrder.LOWEST_FIRST,
  [GameType.JUMBLIE]: RatingOrder.LOWEST_FIRST,
  [GameType.ENSPELLED]: RatingOrder.LOWEST_FIRST,
  [GameType.UNKNOWN]: RatingOrder.LOWEST_FIRST,
};
