import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

const friendRequests = pgTable(
  "friend_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    senderId: text("senderId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: text("receiverId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending, accepted, declined
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    receiverStatusIdx: index("friend_requests_receiverId_status_idx").on(
      table.receiverId,
      table.status
    ),
    senderStatusIdx: index("friend_requests_senderId_status_idx").on(
      table.senderId,
      table.status
    ),
  })
);

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
  }),
}));

export default friendRequests;
