// Core emoji types
export type EmojiType = "👍" | "🔥" | "😮" | "😂" | "❤️" | "🎉";

// Core data types
export interface ScoreComment {
  id: string;
  scoreId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string;
  };
}

export interface ScoreReaction {
  id: string;
  scoreId: string;
  userId: string;
  emojiType: EmojiType;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string;
  };
}

// Aggregated data for UI
export type ReactionSummary = Record<
  EmojiType,
  {
    count: number;
    users: Array<{ id: string; name: string | null }>;
    userHasReacted: boolean;
  }
>;

export interface ScoreInteractions {
  comments: ScoreComment[];
  reactions: ReactionSummary;
}

// API request/response types
export interface CreateCommentRequest {
  scoreId: string;
  content: string;
}

export interface ToggleReactionRequest {
  scoreId: string;
  emojiType: EmojiType;
}

export interface CreateCommentResponse {
  comment: ScoreComment;
}

export interface GetInteractionsResponse {
  interactions: ScoreInteractions;
}
