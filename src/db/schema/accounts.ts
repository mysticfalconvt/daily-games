import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

import users from "./users";

const accounts = pgTable(
  "account",
  {
    // text, not uuid: `user.id` was migrated to text in 0001 and the live
    // column follows it. Declaring uuid here made drizzle-kit want to rewrite a
    // working foreign key on every generate.
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // AdapterAccount is the whole account object; the column holds just its
    // discriminator ("oauth" | "oidc" | ...), so index into it.
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export default accounts;
