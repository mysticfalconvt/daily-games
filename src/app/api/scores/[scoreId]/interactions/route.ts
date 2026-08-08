import { NextRequest, NextResponse } from "next/server";

import { noStore, requireApiUser, withApi } from "@/lib/api";
import { ScoreInteractionService } from "@/services/score-interaction-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const GET = withApi(
  async (request: NextRequest, { params }: { params: { scoreId: string } }) => {
    const { user } = await requireApiUser();

    // Throws 404 if the viewer may not see this score, and filters the
    // comments and reactions to authors they may see.
    const interactions = await ScoreInteractionService.getInteractionsForScore(
      params.scoreId,
      user.id
    );

    return NextResponse.json(
      { interactions },
      { status: 200, headers: noStore }
    );
  }
);
