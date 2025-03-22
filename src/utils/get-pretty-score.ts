import { GameType } from "@/types/types";

export const getPrettyScore = (gameType: GameType, score: string): string => {
  switch (gameType) {
    case GameType.WORDLE:
      // Extract all lines with colored boxes (🟩🟨⬛)
      const wordleLines = score.split("\n");
      const wordleBoxesLines = wordleLines
        .filter(
          (line) =>
            line.includes("🟩") || line.includes("🟨") || line.includes("⬛")
        )
        .join("\n");
      return wordleBoxesLines || score;
    case GameType.EMOVI:
      // Extract the line with colored boxes (🟩🟥⬜)
      const lines = score.split("\n");
      const boxesLine = lines.find(
        (line) =>
          line.includes("🟩") || line.includes("🟥") || line.includes("⬜")
      );
      return boxesLine || score;
    case GameType.FRAMED:
      // Extract the line with colored boxes (🟩🟥⬛)
      const framedLines = score.split("\n");
      const framedBoxesLine = framedLines.find(
        (line) =>
          line.includes("🟩") || line.includes("🟥") || line.includes("⬛")
      );
      return framedBoxesLine || score;
    case GameType.WHERE_TAKEN:
      // Extract colored boxes and stars rows
      const whereTakenLines = score.split("\n");
      const whereTakenBoxesLine = whereTakenLines.find(
        (line) =>
          line.includes("🟦") || line.includes("🟥") || line.includes("⬜")
      );
      const starsLine = whereTakenLines.find((line) => line.includes("⭐"));
      if (whereTakenBoxesLine && starsLine) {
        return `${whereTakenBoxesLine}\n${starsLine}`;
      }
      return score;
    case GameType.MINI_CROSSWORD:
      // Return empty string as minicrossword is just a link
      return "";
    case GameType.COLORFLE:
      // Extract all lines with colored boxes (🟩🟨⬜)
      const colorfleLines = score.split("\n");
      const colorfleBoxesLines = colorfleLines
        .filter(
          (line) =>
            line.includes("🟩") || line.includes("🟨") || line.includes("⬜")
        )
        .join("\n");
      return colorfleBoxesLines || score;
    case GameType.JUMBLIE:
      // Extract colored circles and guesses/time info
      const jumblieLines = score.split("\n");
      const circlesLine = jumblieLines.find(
        (line) =>
          line.includes("🟢") ||
          line.includes("🔵") ||
          line.includes("🔴") ||
          line.includes("🟠")
      );
      const guessesLine = jumblieLines.find((line) =>
        line.includes("guesses in")
      );
      if (circlesLine && guessesLine) {
        return `${circlesLine} ${guessesLine}`;
      }
      return score;
    case GameType.ENSPELLED:
      // Extract colored boxes and link
      const enspelledLines = score.split("\n");
      const enspelledBoxesLine = enspelledLines.find(
        (line) => line.includes("🟥") || line.includes("🟪")
      );
      const linkLine = enspelledLines.find((line) =>
        line.includes("https://enspelled.com")
      );
      if (enspelledBoxesLine && linkLine) {
        // Extract just the URL from the link line
        const urlMatch = linkLine.match(/https:\/\/enspelled\.com\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : linkLine;
        return `${enspelledBoxesLine} [link]${url}`;
      }
      return score;
    case GameType.BANDLE:
      // Extract the line with colored boxes (🟥🟩⬜)
      const bandleLines = score.split("\n");
      const bandleBoxesLine = bandleLines.find(
        (line) =>
          line.includes("🟥") || line.includes("🟩") || line.includes("⬜")
      );
      return bandleBoxesLine || score;
    case GameType.TRAVLE_USA:
      // Extract the line with colored boxes and checkmarks (🟧🟩✅)
      const travleLines = score.split("\n");
      const travleBoxesLine = travleLines.find(
        (line) =>
          line.includes("🟧") || line.includes("🟩") || line.includes("✅")
      );
      return travleBoxesLine || score;
    case GameType.STRANDS:
      // Extract all lines with icons (🔵💡🟡)
      const strandsLines = score.split("\n");
      const strandsIconLines = strandsLines
        .filter(
          (line) =>
            line.includes("🔵") || line.includes("💡") || line.includes("🟡")
        )
        .join("\n");
      return strandsIconLines || score;
    case GameType.CONNECTIONS:
      // Extract all lines with colored boxes (🟦🟨🟩🟪)
      const connectionsLines = score.split("\n");
      const connectionsBoxesLines = connectionsLines
        .filter(
          (line) =>
            line.includes("🟦") ||
            line.includes("🟨") ||
            line.includes("🟩") ||
            line.includes("🟪")
        )
        .join("\n");
      return connectionsBoxesLines || score;
    case GameType.UNKNOWN:
      return score;
    default:
      return score;
  }
};
