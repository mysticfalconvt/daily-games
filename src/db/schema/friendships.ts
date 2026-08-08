import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

/**
 * Friendships are stored as two rows, one per direction, so a lookup only ever
 * needs to check `userId`. The unique constraint keeps a double-accept (two
 * concurrent requests, or a retried click) from producing duplicate rows, which
 * would inflate every friend count that reads this table.
 */
const friendships = pgTable(
  "friendships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: text("friendId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: unique("friendships_userId_friendId_unique").on(
      table.userId,
      table.friendId
    ),
    userIdIdx: index("friendships_userId_idx").on(table.userId),
  })
);

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "user",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friend",
  }),
}));

export default friendships;
