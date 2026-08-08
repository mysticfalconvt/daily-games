import { NextRequest, NextResponse } from "next/server";

import { requireApiWrite, withApi } from "@/lib/api";
import { ScoreInteractionService } from "@/services/score-interaction-service";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const DELETE = withApi(
  async (
    request: NextRequest,
    { params }: { params: { commentId: string } }
  ) => {
    const { user } = await requireApiWrite();

    await ScoreInteractionService.deleteComment(user.id, params.commentId);

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  }
);
