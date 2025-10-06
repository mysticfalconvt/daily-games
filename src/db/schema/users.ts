import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import friendRequests from "./friend-requests";
import friendships from "./friendships";
import gameScoreEntries from "./game-score-entries";

const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 2048 }).notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
});

export const usersRelations = relations(users, ({ many }) => ({
  gameScoreEntries: many(gameScoreEntries),
  sentFriendRequests: many(friendRequests, { relationName: "sender" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  friendships: many(friendships, { relationName: "user" }),
  friendOf: many(friendships, { relationName: "friend" }),
  scoreComments: many("scoreComments"),
  scoreReactions: many("scoreReactions"),
}));

export default users;
