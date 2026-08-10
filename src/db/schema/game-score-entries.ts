import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
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
    // Wall-clock ms from opening the game (via the "Today's games" link) to
    // pasting the score. Self-reported by the client, so it is clamped on the
    // way in - see createGameScoreEntry. Null whenever the player did not
    // launch from the app, which is most of the time; the feed falls back to
    // the gap between consecutive posts.
    durationMs: integer("duration_ms"),
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
  // Not a user-authored field. It rides along in the form data and is parsed
  // and clamped server-side, so keeping it out of here means a junk value
  // cannot fail validation on an otherwise good score.
  durationMs: true,
});

export default gameScoreEntries;
