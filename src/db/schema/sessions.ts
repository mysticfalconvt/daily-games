import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import users from "./users";

const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  // text, not uuid - matches the live column. See accounts.ts.
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export default sessions;
