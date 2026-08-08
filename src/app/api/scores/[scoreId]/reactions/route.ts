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
import { EmojiType, ToggleReactionRequest } from "@/types/interactions";

// Per-user and never cacheable. Declared so the build does not try to
// statically evaluate a handler that needs the session.
export const dynamic = "force-dynamic";

const VALID_EMOJIS: EmojiType[] = ["👍", "🔥", "😮", "😂", "❤️", "🎉"];

export const POST = withApi(
  async (request: NextRequest, { params }: { params: { scoreId: string } }) => {
    const { user } = await requireApiWrite();
    enforceRateLimit("reaction", user.id);

    const body = (await request.json()) as ToggleReactionRequest;

    if (!VALID_EMOJIS.includes(body?.emojiType)) {
      throw badRequest("Invalid emoji type");
    }

    await ScoreInteractionService.toggleReaction(
      user.id,
      params.scoreId,
      body.emojiType
    );

    return NextResponse.json(
      { message: "Reaction toggled successfully" },
      { status: 200 }
    );
  }
);

export const GET = withApi(
  async (request: NextRequest, { params }: { params: { scoreId: string } }) => {
    const { user } = await requireApiUser();

    await VisibilityService.requireViewableScore(user.id, params.scoreId);

    const reactions = await ScoreInteractionService.getReactionSummary(
      params.scoreId,
      user.id
    );

    return NextResponse.json({ reactions }, { status: 200, headers: noStore });
  }
);
