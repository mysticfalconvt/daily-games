import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

const gameScoreEntries = pgTable(
  "gameScore_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    gameType: text("gameType").notNull(),
    score: text("score").notNull(),
    rating: numeric("rating").notNull(),
  },
  (table) => ({
    // The feed always filters by visible users over a date window.
    userIdCreatedAtIdx: index("gameScore_entries_userId_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    createdAtIdx: index("gameScore_entries_created_at_idx").on(table.createdAt),
  })
);

export const gameScoreEntriesRelations = relations(
  gameScoreEntries,
  ({ one }) => ({
    user: one(users, {
      fields: [gameScoreEntries.userId],
      references: [users.id],
    }),
  })
);

export const InsertGameScoreEntrySchema = createInsertSchema(
  gameScoreEntries
).omit({
  userId: true,
  createdAt: true,
});

export default gameScoreEntries;
