import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { ScoreInteractionService } from "@/services/score-interaction-service";
import { CreateCommentRequest } from "@/types/interactions";

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

        const body = await request.json() as CreateCommentRequest;
        const { content } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Bad Request", message: "Comment content is required" },
                { status: 400 }
            );
        }

        if (content.trim().length === 0) {
            return NextResponse.json(
                { error: "Bad Request", message: "Comment content cannot be empty" },
                { status: 400 }
            );
        }

        if (content.length > 500) {
            return NextResponse.json(
                { error: "Bad Request", message: "Comment content cannot exceed 500 characters" },
                { status: 400 }
            );
        }

        const comment = await ScoreInteractionService.createComment(
            session.user.id,
            params.scoreId,
            content
        );

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);

        if (error instanceof Error) {
            const statusCode =
                error.message === "You do not have permission to comment on this score" ? 403 :
                    error.message === "Comment content cannot be empty" ? 400 :
                        error.message === "Comment content cannot exceed 500 characters" ? 400 :
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

        const comments = await ScoreInteractionService.getCommentsForScore(params.scoreId);

        return NextResponse.json({ comments }, { status: 200 });
    } catch (error) {
        console.error("Error fetching comments:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}