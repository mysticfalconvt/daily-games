import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import adminAuditLog from "./admin-audit-log";
import friendRequests from "./friend-requests";
import friendships from "./friendships";
import gameScoreEntries from "./game-score-entries";
import loginEvents from "./login-events";
import scoreComments from "./score-comments";
import scoreReactions from "./score-reactions";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 2048 }).notNull(),
  // Who may see the scores this user posts: everyone, or friends only.
  isPrivate: boolean("is_private").notNull().default(false),
  // Who may see this user's comments and reactions, independently of whose
  // score they land on. A private user commenting on a public score would
  // otherwise expose their name to strangers.
  interactionsPrivate: boolean("interactions_private").notNull().default(false),
  role: text("role", { enum: USER_ROLES }).notNull().default("user"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  loginCount: integer("login_count").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  gameScoreEntries: many(gameScoreEntries),
  sentFriendRequests: many(friendRequests, { relationName: "sender" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  friendships: many(friendships, { relationName: "user" }),
  friendOf: many(friendships, { relationName: "friend" }),
  scoreComments: many(scoreComments),
  scoreReactions: many(scoreReactions),
  loginEvents: many(loginEvents),
  adminActions: many(adminAuditLog, { relationName: "adminUser" }),
  adminActionsTargeting: many(adminAuditLog, { relationName: "targetUser" }),
}));

/**
 * Columns safe to expose to any authenticated viewer who is allowed to see this
 * user. Deliberately omits email - it is PII that the feed has no use for, and
 * every score payload used to carry it.
 */
export const PUBLIC_USER_COLUMNS = {
  id: true,
  name: true,
  image: true,
} as const;

export default users;
