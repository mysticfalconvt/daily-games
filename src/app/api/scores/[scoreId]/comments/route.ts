import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  noStore,
  requireApiUser,
  requireApiWrite,
  withApi,
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ScoreInteractionService } from "@/services/score-interaction-service";
import { VisibilityService } from "@/services/visibility-service";
import { CreateCommentRequest } from "@/types/interactions";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

export const POST = withApi(
  async (request: NextRequest, { params }: { params: { scoreId: string } }) => {
    const { user } = await requireApiWrite();
    enforceRateLimit("comment", user.id);

    const body = (await request.json()) as CreateCommentRequest;

    if (typeof body?.content !== "string") {
      throw badRequest("Comment content is required");
    }

    const comment = await ScoreInteractionService.createComment(
      user.id,
      params.scoreId,
      body.content
    );

    return NextResponse.json({ comment }, { status: 201 });
  }
);

export const GET = withApi(
  async (request: NextRequest, { params }: { params: { scoreId: string } }) => {
    const { user } = await requireApiUser();

    // Was completely unauthenticated beyond "is logged in": any user could
    // read the comments on any score id, including private users' scores.
    await VisibilityService.requireViewableScore(user.id, params.scoreId);

    const comments = await ScoreInteractionService.getCommentsForScore(
      params.scoreId,
      user.id
    );

    return NextResponse.json({ comments }, { status: 200, headers: noStore });
  }
);
