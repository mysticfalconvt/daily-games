import { NextRequest, NextResponse } from "next/server";

import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { env } from "@/env/server";
import {
  badRequest,
  noStore,
  requireApiUser,
  requireApiWrite,
  withApi,
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

// Never let a browser subscription turn this server into an arbitrary HTTP client.
function allowedEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  const host = url.hostname.toLowerCase();
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    !url.port &&
    (host === "fcm.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".push.apple.com") ||
      host.endsWith(".notify.windows.com"))
  );
}

export const GET = withApi(async () => {
  await requireApiUser();
  return NextResponse.json(
    {
      publicKey:
        env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT
          ? env.VAPID_PUBLIC_KEY
          : null,
    },
    { headers: noStore }
  );
});

export const POST = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();
  enforceRateLimit("pushSubscription", user.id);
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
    throw badRequest("Push notifications are not configured");
  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success || !allowedEndpoint(parsed.data.endpoint))
    throw badRequest("Invalid push subscription");
  const { endpoint, keys } = parsed.data;
  const [existing] = await db
    .select({ endpoint: pushSubscriptions.endpoint })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, user.id)
      )
    );
  if (!existing) {
    const [total] = await db
      .select({ count: count() })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.id));
    if (total.count >= 10)
      throw badRequest("Too many devices registered for notifications");
  }
  await db
    .insert(pushSubscriptions)
    .values({ endpoint, userId: user.id, ...keys })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, ...keys },
    });
  return NextResponse.json({ ok: true });
});

export const DELETE = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();
  enforceRateLimit("pushSubscription", user.id);
  const body = await request.json();
  if (typeof body?.endpoint !== "string" || body.endpoint.length > 2048)
    throw badRequest("Invalid endpoint");
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, body.endpoint)
      )
    );
  return NextResponse.json({ ok: true });
});
