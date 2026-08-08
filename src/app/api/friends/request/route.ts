import { NextRequest, NextResponse } from "next/server";

import { badRequest, requireApiWrite, withApi } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { FriendService } from "@/services/friend-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();
  // "User not found" tells the caller whether an address is registered. That
  // is unavoidable - it is how you add someone private - so the control is the
  // rate limit rather than a vaguer error.
  enforceRateLimit("friendRequest", user.id);

  const body = await request.json();

  // The search box sends a resolved id so it never has to expose an email.
  if (typeof body?.userId === "string" && body.userId) {
    await FriendService.sendFriendRequest(user.id, body.userId);
    return NextResponse.json(
      { message: "Friend request sent successfully" },
      { status: 200 }
    );
  }

  if (typeof body?.email !== "string" || !EMAIL_PATTERN.test(body.email)) {
    throw badRequest("A valid email address is required");
  }

  await FriendService.sendFriendRequestByEmail(user.id, body.email);

  return NextResponse.json(
    { message: "Friend request sent successfully" },
    { status: 200 }
  );
});
