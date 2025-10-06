import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import gameScoreEntries from "./game-score-entries";
import users from "./users";

const scoreComments = pgTable("score_comments", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    scoreId: text("score_id")
        .notNull()
        .references(() => gameScoreEntries.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const scoreCommentsRelations = relations(
    scoreComments,
    ({ one }) => ({
        score: one(gameScoreEntries, {
            fields: [scoreComments.scoreId],
            references: [gameScoreEntries.id],
        }),
        user: one(users, {
            fields: [scoreComments.userId],
            references: [users.id],
        }),
    })
);

export const InsertScoreCommentSchema = createInsertSchema(
    scoreComments
).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export default scoreComments;