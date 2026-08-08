import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import db from "@/db";
import { users } from "@/db/schema";
import {
  badRequest,
  noStore,
  requireApiUser,
  requireApiWrite,
  withApi,
} from "@/lib/api";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export type PrivacySettings = {
  /** Who may see the scores you post. */
  isPrivate: boolean;
  /** Who may see your comments and reactions, wherever they appear. */
  interactionsPrivate: boolean;
};

export const GET = withApi(async () => {
  const { user } = await requireApiUser();

  const row = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { isPrivate: true, interactionsPrivate: true },
  });

  const settings: PrivacySettings = {
    isPrivate: row?.isPrivate ?? false,
    interactionsPrivate: row?.interactionsPrivate ?? false,
  };

  return NextResponse.json(settings, { status: 200, headers: noStore });
});

export const PUT = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();

  const body = await request.json();
  const update: Partial<PrivacySettings> = {};

  if ("isPrivate" in body) {
    if (typeof body.isPrivate !== "boolean") {
      throw badRequest("isPrivate must be a boolean");
    }
    update.isPrivate = body.isPrivate;
  }

  if ("interactionsPrivate" in body) {
    if (typeof body.interactionsPrivate !== "boolean") {
      throw badRequest("interactionsPrivate must be a boolean");
    }
    update.interactionsPrivate = body.interactionsPrivate;
  }

  if (Object.keys(update).length === 0) {
    throw badRequest("Nothing to update");
  }

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, user.id))
    .returning({
      isPrivate: users.isPrivate,
      interactionsPrivate: users.interactionsPrivate,
    });

  return NextResponse.json(updated, { status: 200, headers: noStore });
});
