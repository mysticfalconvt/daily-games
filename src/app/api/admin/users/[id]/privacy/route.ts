import { NextRequest, NextResponse } from "next/server";

import { badRequest, notFound, requireApiAdmin, withApi } from "@/lib/api";
import { AdminService } from "@/services/admin-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

/**
 * Updates another user's privacy switches.
 *
 * requireApiAdmin refuses while impersonating, so this cannot be reached from
 * inside a borrowed session.
 */
export const PATCH = withApi(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { user: admin } = await requireApiAdmin();

    const body = await request.json();
    const changes: { isPrivate?: boolean; interactionsPrivate?: boolean } = {};

    for (const key of ["isPrivate", "interactionsPrivate"] as const) {
      if (key in body) {
        if (typeof body[key] !== "boolean") {
          throw badRequest(`${key} must be a boolean`);
        }
        changes[key] = body[key];
      }
    }

    if (Object.keys(changes).length === 0) {
      throw badRequest("Nothing to update");
    }

    const updated = await AdminService.setUserPrivacy(
      admin.id,
      params.id,
      changes
    );

    if (!updated) {
      throw notFound("User not found");
    }

    return NextResponse.json(updated, { status: 200 });
  }
);
