import { NextRequest, NextResponse } from "next/server";

import { noStore, requireApiUser, withApi } from "@/lib/api";
import { ScoreFilterService } from "@/services/score-filter-service";
import { VisibilityService } from "@/services/visibility-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const GET = withApi(async (request: NextRequest) => {
  const { user } = await requireApiUser();

  // A display preference only - it can narrow the feed to friends, never widen
  // it past what VisibilityService allows.
  const friendsOnly =
    new URL(request.url).searchParams.get("friendsOnly") === "true";

  const [scores, hasFriends] = await Promise.all([
    ScoreFilterService.getWeeklyFilteredScores(user.id, friendsOnly),
    VisibilityService.hasFriends(user.id),
  ]);

  return NextResponse.json(
    { scores, hasFriends },
    { status: 200, headers: noStore }
  );
});
