import { DefaultSession } from "next-auth";

import type { UserRole } from "@/db/schema/users";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
    /**
     * Set only while an admin is viewing the app as someone else. `user` is
     * then the impersonated user, and this carries the real one.
     */
    impersonation: {
      adminId: string;
      adminName: string | null;
      adminEmail: string;
      expiresAt: string;
    } | null;
  }
}
