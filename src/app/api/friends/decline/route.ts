import { NextRequest, NextResponse } from "next/server";

import { badRequest, requireApiWrite, withApi } from "@/lib/api";
import { FriendService } from "@/services/friend-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const POST = withApi(async (request: NextRequest) => {
  const { user } = await requireApiWrite();

  const body = await request.json();
  if (typeof body?.requestId !== "string" || !body.requestId) {
    throw badRequest("Request ID is required");
  }

  await FriendService.declineFriendRequest(body.requestId, user.id);

  return NextResponse.json(
    { message: "Friend request declined successfully" },
    { status: 200 }
  );
});
