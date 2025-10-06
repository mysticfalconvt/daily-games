import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

const friendships = pgTable("friendships", {
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
});

export const friendshipsRelations = relations(friendships, ({ one }) => ({
    user: one(users, {
        fields: [friendships.userId],
        references: [users.id],
    }),
    friend: one(users, {
        fields: [friendships.friendId],
        references: [users.id],
    }),
}));

export default friendships;