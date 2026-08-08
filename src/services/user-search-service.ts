import { and, eq, ne, sql } from "drizzle-orm";

import db from "@/db";
import { users } from "@/db/schema";

import { normalizeEmail } from "./friend-service";

export type UserSearchResult = {
  id: string;
  name: string | null;
  image: string;
  /** Present only when the caller already knew the address they typed. */
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Finds people to send a friend request to.
 *
 * Two paths, on purpose:
 *
 *  - A complete email address resolves anyone, private or not. This is how you
 *    add someone who does not want to be browsable.
 *  - Anything else is treated as a name fragment and matches only users who
 *    have not marked themselves private. No email is returned on this path.
 *
 * The previous implementation ran `ilike(email, '%q%')` with no privacy filter
 * and returned full email addresses, so `q=a` was enough to start walking the
 * user table.
 */
export class UserSearchService {
  static async search(
    viewerId: string,
    rawQuery: string
  ): Promise<UserSearchResult[]> {
    const query = rawQuery.trim();

    if (query.length < 2) {
      return [];
    }

    if (EMAIL_PATTERN.test(query)) {
      const email = normalizeEmail(query);
      const match = await db.query.users.findFirst({
        where: and(
          sql`lower(${users.email}) = ${email}`,
          ne(users.id, viewerId)
        ),
        columns: { id: true, name: true, image: true, email: true },
      });

      return match ? [match] : [];
    }

    const matches = await db.query.users.findMany({
      where: and(
        eq(users.isPrivate, false),
        ne(users.id, viewerId),
        // Prefix match on the display name only. Substring matching on email
        // is what made the directory enumerable.
        sql`${users.name} ILIKE ${`${query}%`}`
      ),
      columns: { id: true, name: true, image: true },
      orderBy: (fields, { asc }) => asc(fields.name),
      limit: 10,
    });

    return matches;
  }
}
