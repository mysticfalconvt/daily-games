import { NextResponse } from "next/server";

import { noStore, requireApiUser, withApi } from "@/lib/api";
import { FriendService } from "@/services/friend-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const { user } = await requireApiUser();
  const requests = await FriendService.getIncomingRequests(user.id);

  return NextResponse.json({ requests }, { status: 200, headers: noStore });
});
