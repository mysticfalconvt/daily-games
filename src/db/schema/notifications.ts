import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import scoreComments from "./score-comments";
import users from "./users";

const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => scoreComments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("read_at", { mode: "date" }),
  },
  (table) => ({
    recipientCommentUnique: unique("notifications_recipient_comment_unique").on(
      table.recipientId,
      table.commentId
    ),
    recipientIdx: index("notifications_recipient_idx").on(
      table.recipientId,
      table.createdAt
    ),
  })
);

export default notifications;
