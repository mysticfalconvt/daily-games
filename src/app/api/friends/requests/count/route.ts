import { NextResponse } from "next/server";

import { noStore, requireApiUser, withApi } from "@/lib/api";
import { FriendService } from "@/services/friend-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const { user } = await requireApiUser();
  const count = await FriendService.getPendingRequestCount(user.id);

  return NextResponse.json({ count }, { status: 200, headers: noStore });
});
