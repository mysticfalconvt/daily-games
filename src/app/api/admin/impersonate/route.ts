import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import db from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env/server";
import {
  badRequest,
  forbidden,
  notFound,
  requireApiAdmin,
  requireApiUser,
  withApi,
} from "@/lib/api";
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_AGE_SECONDS,
  createImpersonationToken,
} from "@/lib/impersonation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { AdminService } from "@/services/admin-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

/** Start impersonating a user. Read-only: see requireApiWrite. */
export const POST = withApi(async (request: NextRequest) => {
  // requireApiAdmin fails while already impersonating, which is what we want -
  // no chaining from one borrowed identity into another.
  const { user: admin } = await requireApiAdmin();
  enforceRateLimit("impersonate", admin.id);

  const body = await request.json();
  if (typeof body?.userId !== "string" || !body.userId) {
    throw badRequest("userId is required");
  }

  if (body.userId === admin.id) {
    throw badRequest("You are already yourself");
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, body.userId),
    columns: { id: true, name: true, email: true, role: true },
  });

  if (!target) {
    throw notFound("User not found");
  }

  if (target.role === "admin") {
    // Nothing is gained by viewing as another admin, and it muddies the audit
    // trail for whatever that admin then appears to do.
    throw forbidden("Cannot impersonate another admin");
  }

  const { value, token } = createImpersonationToken(admin.id, target.id);

  await AdminService.recordAudit({
    adminUserId: admin.id,
    action: "impersonation.start",
    targetUserId: target.id,
    detail: `Impersonating ${target.email} until ${new Date(
      token.expiresAt * 1000
    ).toISOString()}`,
  });

  cookies().set(IMPERSONATION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });

  return NextResponse.json(
    {
      message: `Now viewing as ${target.name ?? target.email}`,
      expiresAt: new Date(token.expiresAt * 1000).toISOString(),
    },
    { status: 200 }
  );
});

/**
 * Stop impersonating. Deliberately not behind requireApiAdmin: while
 * impersonating, `isAdmin` is false, and the way out must always be open.
 */
export const DELETE = withApi(async () => {
  const context = await requireApiUser();

  if (context.impersonation) {
    await AdminService.recordAudit({
      adminUserId: context.impersonation.adminId,
      action: "impersonation.stop",
      targetUserId: context.user.id,
      detail: `Stopped viewing as ${context.user.email}`,
    });
  }

  cookies().delete(IMPERSONATION_COOKIE);

  return NextResponse.json({ message: "Impersonation ended" }, { status: 200 });
});
