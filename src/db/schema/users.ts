import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
// @ts-expect-error nextjs
import { v4 as uuidv4 } from "uuid";

const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 2048 }).notNull(),
});

export default users;
