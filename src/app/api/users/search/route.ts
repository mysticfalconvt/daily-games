import { NextRequest, NextResponse } from "next/server";

import { noStore, requireApiUser, withApi } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { UserSearchService } from "@/services/user-search-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const GET = withApi(async (request: NextRequest) => {
  const { user } = await requireApiUser();
  enforceRateLimit("userSearch", user.id);

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const users = await UserSearchService.search(user.id, query);

  return NextResponse.json({ users }, { status: 200, headers: noStore });
});
