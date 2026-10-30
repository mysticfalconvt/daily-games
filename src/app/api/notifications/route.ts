import { NextRequest, NextResponse } from "next/server";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

import db from "@/db";
import {
  gameScoreEntries,
  notifications,
  scoreComments,
  users,
} from "@/db/schema";
import {
  badRequest,
  noStore,
  requireApiUser,
  requireApiWrite,
  withApi,
} from "@/lib/api";
import { VisibilityService } from "@/services/visibility-service";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const { user } = await requireApiUser();
  const visibleAuthors = await VisibilityService.getVisibleInteractionAuthorIds(
    user.id
  );
  const visible = and(
    eq(notifications.recipientId, user.id),
    inArray(scoreComments.userId, visibleAuthors)
  );
  const [items, unread] = await Promise.all([
    db
      .select({
        id: notifications.id,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
        scoreId: gameScoreEntries.id,
        gameType: gameScoreEntries.gameType,
        author: users.name,
      })
      .from(notifications)
      .innerJoin(scoreComments, eq(notifications.commentId, scoreComments.id))
      .innerJoin(
        gameScoreEntries,
        eq(scoreComments.scoreId, gameScoreEntries.id)
      )
      .innerJoin(users, eq(scoreComments.userId, users.id))
      .where(visible)
      .orderBy(desc(notifications.createdAt))
      .limit(30),
    db
      .select({ count: count() })
      .from(notifications)
      .innerJoin(scoreComments, eq(notifications.commentId, scoreComments.id))
      .where(and(visible, isNull(notifications.readAt))),
  ]);
  return NextResponse.json(
    { items, unread: unread[0].count },
    { headers: noStore }
  );
});

export const POST = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();
  const body = await request.json();
  if (body?.all === true) {
    const visibleAuthors =
      await VisibilityService.getVisibleInteractionAuthorIds(user.id);
    const visibleComments = db
      .select({ id: scoreComments.id })
      .from(scoreComments)
      .where(inArray(scoreComments.userId, visibleAuthors));
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, user.id),
          isNull(notifications.readAt),
          inArray(notifications.commentId, visibleComments)
        )
      );
    return NextResponse.json({ ok: true });
  }
  if (typeof body?.id !== "string")
    throw badRequest("Notification ID is required");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, body.id),
        eq(notifications.recipientId, user.id),
        isNull(notifications.readAt)
      )
    );
  return NextResponse.json({ ok: true });
});
