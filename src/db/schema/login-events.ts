import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

/**
 * One row per successful sign-in, recorded from the NextAuth `signIn` event.
 * Exists so the admin views can answer "when did this person last get in, and
 * from what" without guessing from session rows, which disappear on expiry.
 */
const loginEvents = pgTable(
  "login_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider"),
    isNewUser: boolean("is_new_user").notNull().default(false),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdCreatedAtIdx: index("login_events_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export const loginEventsRelations = relations(loginEvents, ({ one }) => ({
  user: one(users, {
    fields: [loginEvents.userId],
    references: [users.id],
  }),
}));

export default loginEvents;
