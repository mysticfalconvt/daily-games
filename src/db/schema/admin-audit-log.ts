import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

import users from "./users";

export const ADMIN_ACTIONS = [
  "impersonation.start",
  "impersonation.stop",
  "role.grant",
  "role.revoke",
  "privacy.update",
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

/**
 * Append-only record of privileged actions. Impersonation is the reason this
 * exists: acting as another user has to leave a trail that the acting admin
 * cannot quietly erase from the UI.
 */
const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action", { enum: ADMIN_ACTIONS }).notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("admin_audit_log_created_at_idx").on(table.createdAt),
  })
);

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  adminUser: one(users, {
    fields: [adminAuditLog.adminUserId],
    references: [users.id],
    relationName: "adminUser",
  }),
  targetUser: one(users, {
    fields: [adminAuditLog.targetUserId],
    references: [users.id],
    relationName: "targetUser",
  }),
}));

export default adminAuditLog;
