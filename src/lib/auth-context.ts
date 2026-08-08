import { redirect } from "next/navigation";

import { Session, getServerSession } from "next-auth";

import options from "@/config/auth";
import type { UserRole } from "@/db/schema/users";

export type AuthContext = {
  /**
   * The user the request acts as. While impersonating this is the *target*,
   * which is the whole point - every read path then sees what they see.
   */
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: UserRole;
  };
  /**
   * True only for a real admin who is not currently impersonating. Admin
   * surfaces stay closed while acting as someone else, so a stray click cannot
   * escalate from inside a borrowed identity.
   */
  isAdmin: boolean;
  impersonation: Session["impersonation"];
};

function toContext(session: Session | null): AuthContext | null {
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const impersonation = session.impersonation ?? null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email,
      image: session.user.image ?? null,
      role: session.user.role ?? "user",
    },
    isAdmin: session.user.role === "admin" && !impersonation,
    impersonation,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  return toContext(await getServerSession(options));
}

/**
 * Server-component guard: sends anonymous visitors to the landing page.
 *
 * Do NOT call this from `/` - it redirects there, so on that route it is an
 * infinite redirect. The landing page checks `getAuthContext()` directly.
 */
export async function requireUser(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/");
  }
  return context;
}

/**
 * Server-component guard for admin pages. Non-admins are bounced to the home
 * page rather than shown a 403, so the existence of /admin is not confirmed.
 */
export async function requireAdminUser(): Promise<AuthContext> {
  const context = await requireUser();
  if (!context.isAdmin) {
    redirect("/");
  }
  return context;
}
