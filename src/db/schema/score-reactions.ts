import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import gameScoreEntries from "./game-score-entries";
import users from "./users";

const scoreReactions = pgTable(
  "score_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    scoreId: text("score_id")
      .notNull()
      .references(() => gameScoreEntries.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emojiType: text("emoji_type", {
      enum: ["👍", "🔥", "😮", "😂", "❤️", "🎉"],
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserScoreEmoji: unique().on(
      table.scoreId,
      table.userId,
      table.emojiType
    ),
    scoreIdIdx: index("score_reactions_score_id_idx").on(table.scoreId),
  })
);

export const scoreReactionsRelations = relations(scoreReactions, ({ one }) => ({
  score: one(gameScoreEntries, {
    fields: [scoreReactions.scoreId],
    references: [gameScoreEntries.id],
  }),
  user: one(users, {
    fields: [scoreReactions.userId],
    references: [users.id],
  }),
}));

export const InsertScoreReactionSchema = createInsertSchema(
  scoreReactions
).omit({
  id: true,
  createdAt: true,
});

export default scoreReactions;
