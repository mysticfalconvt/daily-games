import { requireUser } from "@/lib/auth-context";

/**
 * @deprecated Use `requireUser` from `@/lib/auth-context`, which returns the
 * caller instead of only asserting that one exists.
 */
export default async function requireAuth() {
  await requireUser();
}
