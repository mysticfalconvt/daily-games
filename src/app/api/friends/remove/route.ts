import { NextRequest, NextResponse } from "next/server";

import { badRequest, requireApiWrite, withApi } from "@/lib/api";
import { FriendService } from "@/services/friend-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const DELETE = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();

  const body = await request.json();
  if (typeof body?.friendId !== "string" || !body.friendId) {
    throw badRequest("Friend ID is required");
  }

  await FriendService.removeFriend(user.id, body.friendId);

  return NextResponse.json(
    { message: "Friend removed successfully" },
    { status: 200 }
  );
});
