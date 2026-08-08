import { env } from "@/env/server";

/**
 * Emails from ADMIN_EMAILS, normalised the same way we normalise everything
 * else that gets compared to a stored email.
 */
function adminEmailSet(): Set<string> {
  return new Set(
    env.ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return adminEmailSet().has(email.trim().toLowerCase());
}
