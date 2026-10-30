import { and, eq } from "drizzle-orm";
import webpush from "web-push";

import db from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { env } from "@/env/server";

import { VisibilityService } from "./visibility-service";

export async function sendCommentPush(
  recipientId: string,
  authorId: string,
  scoreId: string
) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
    return;
  const score = await db.query.gameScoreEntries.findFirst({
    where: (fields, { eq }) => eq(fields.id, scoreId),
    columns: { userId: true },
  });
  if (
    !score ||
    !(await VisibilityService.canViewScoresOf(recipientId, score.userId))
  )
    return;
  const visibleAuthors =
    await VisibilityService.getVisibleInteractionAuthorIds(recipientId);
  if (!visibleAuthors.includes(authorId)) return;
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, recipientId));
  const payload = JSON.stringify({
    url: `/scores/${encodeURIComponent(scoreId)}`,
  });
  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          {
            vapidDetails: {
              subject: env.VAPID_SUBJECT!,
              publicKey: env.VAPID_PUBLIC_KEY!,
              privateKey: env.VAPID_PRIVATE_KEY!,
            },
            TTL: 3600,
            timeout: 5000,
          }
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db
            .delete(pushSubscriptions)
            .where(
              and(
                eq(pushSubscriptions.endpoint, subscription.endpoint),
                eq(pushSubscriptions.userId, recipientId)
              )
            );
        } else console.error("Failed to deliver push notification:", error);
      }
    })
  );
}
