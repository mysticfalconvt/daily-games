import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const session = pgTable(
  "session",
  {
    sessionToken: text("sessionToken").primaryKey().notNull(),
    userId: text("userId").notNull(),
    expires: timestamp("expires", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      sessionUserIdUserIdFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "session_userId_user_id_fk",
      }).onDelete("cascade"),
    };
  }
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerified: timestamp("emailVerified", { mode: "string" }),
    image: varchar("image", { length: 2048 }).notNull(),
  },
  (table) => {
    return {
      userEmailUnique: unique("user_email_unique").on(table.email),
    };
  }
);

export const gameScoreEntries = pgTable("gameScore_entries", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("userId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  gameType: text("gameType").notNull(),
  score: text("score").notNull(),
  rating: numeric("rating").notNull(),
});

export const account = pgTable(
  "account",
  {
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => {
    return {
      accountUserIdUserIdFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "account_userId_user_id_fk",
      }).onDelete("cascade"),
      accountProviderProviderAccountIdPk: primaryKey({
        columns: [table.provider, table.providerAccountId],
        name: "account_provider_providerAccountId_pk",
      }),
    };
  }
);
