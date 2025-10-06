import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { ScoreInteractionService } from "@/services/score-interaction-service";
import { EmojiType, ToggleReactionRequest } from "@/types/interactions";

const VALID_EMOJIS: EmojiType[] = ["👍", "🔥", "😮", "😂", "❤️", "🎉"];

export async function POST(
    request: NextRequest,
    { params }: { params: { scoreId: string } }
) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await request.json() as ToggleReactionRequest;
        const { emojiType } = body;

        if (!emojiType || typeof emojiType !== "string") {
            return NextResponse.json(
                { error: "Bad Request", message: "Emoji type is required" },
                { status: 400 }
            );
        }

        if (!VALID_EMOJIS.includes(emojiType as EmojiType)) {
            return NextResponse.json(
                { error: "Bad Request", message: "Invalid emoji type" },
                { status: 400 }
            );
        }

        await ScoreInteractionService.toggleReaction(
            session.user.id,
            params.scoreId,
            emojiType as EmojiType
        );

        return NextResponse.json(
            { message: "Reaction toggled successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error toggling reaction:", error);

        if (error instanceof Error) {
            const statusCode =
                error.message === "You do not have permission to react to this score" ? 403 :
                    500;

            return NextResponse.json(
                { error: "Request Failed", message: error.message },
                { status: statusCode }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { scoreId: string } }
) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const reactionSummary = await ScoreInteractionService.getReactionSummary(
            params.scoreId,
            session.user.id
        );

        return NextResponse.json({ reactions: reactionSummary }, { status: 200 });
    } catch (error) {
        console.error("Error fetching reactions:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}