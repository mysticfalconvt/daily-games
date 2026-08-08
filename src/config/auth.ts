import { cookies, headers } from "next/headers";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import db from "@/db";
import { loginEvents, users } from "@/db/schema";
import { env } from "@/env/server";
import { isAdminEmail } from "@/lib/admin-emails";
import {
  IMPERSONATION_COOKIE,
  verifyImpersonationToken,
} from "@/lib/impersonation";

/**
 * The request-scoped helpers below are called from NextAuth callbacks, which
 * also run in contexts without a request (and would throw). Failing to read a
 * cookie must never break sign-in, so every one of these degrades to null.
 */
function readCookie(name: string): string | undefined {
  try {
    return cookies().get(name)?.value;
  } catch {
    return undefined;
  }
}

function readHeader(name: string): string | null {
  try {
    return headers().get(name);
  } catch {
    return null;
  }
}

function clientIp(): string | null {
  const forwarded = readHeader("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxies.
    return forwarded.split(",")[0]!.trim() || null;
  }
  return readHeader("x-real-ip");
}

const options: NextAuthOptions = {
  pages: {
    signIn: "/",
  },
  adapter: DrizzleAdapter(db),
  callbacks: {
    async session({ session, user }) {
      // The adapter hands back the full row, so these are already loaded.
      const dbUser = user as typeof users.$inferSelect;

      session.user.id = dbUser.id;
      // ADMIN_EMAILS is the bootstrap authority, so honour it here as well as
      // the stored role. Otherwise being an admin depends on the sign-in event
      // having successfully written the column, and a listed address that
      // signed in before the role column existed would never get in.
      session.user.role =
        dbUser.role === "admin" || isAdminEmail(dbUser.email)
          ? "admin"
          : "user";
      session.impersonation = null;

      const token = verifyImpersonationToken(readCookie(IMPERSONATION_COOKIE));
      if (!token || token.adminId !== dbUser.id) {
        return session;
      }

      // A valid signature only proves we minted the cookie. Re-check the grant
      // against the database so revoking the role ends impersonation at once.
      const [admin, target] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, token.adminId),
          columns: { id: true, name: true, email: true, role: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, token.targetId),
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        }),
      ]);

      if (
        !admin ||
        (admin.role !== "admin" && !isAdminEmail(admin.email)) ||
        !target
      ) {
        return session;
      }

      session.impersonation = {
        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,
        expiresAt: new Date(token.expiresAt * 1000).toISOString(),
      };
      session.user = {
        id: target.id,
        name: target.name,
        email: target.email,
        image: target.image,
        role: target.role,
      };

      return session;
    },
  },
  events: {
    /**
     * Records the login and keeps the admin role in sync with ADMIN_EMAILS.
     * Everything here is best-effort: a bookkeeping failure must not stop
     * someone from signing in.
     */
    async signIn({ user, account, isNewUser }) {
      if (!user.id) {
        return;
      }

      try {
        const shouldBeAdmin = isAdminEmail(user.email);

        await db
          .update(users)
          .set({
            lastLoginAt: new Date(),
            loginCount: sql`${users.loginCount} + 1`,
            ...(shouldBeAdmin ? { role: "admin" as const } : {}),
          })
          .where(eq(users.id, user.id));

        await db.insert(loginEvents).values({
          userId: user.id,
          provider: account?.provider ?? null,
          isNewUser: Boolean(isNewUser),
          ipAddress: clientIp(),
          userAgent: readHeader("user-agent")?.slice(0, 500) ?? null,
        });
      } catch (error) {
        console.error("Failed to record sign-in for user", user.id, error);
      }
    },
    /** Impersonation must not survive the admin logging out. */
    async signOut() {
      try {
        cookies().delete(IMPERSONATION_COOKIE);
      } catch {
        // Not in a request scope - nothing to clear.
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
};

export default options;
