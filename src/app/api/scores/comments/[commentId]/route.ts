import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { ScoreInteractionService } from "@/services/score-interaction-service";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { commentId: string } }
) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        await ScoreInteractionService.deleteComment(session.user.id, params.commentId);

        return NextResponse.json(
            { message: "Comment deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting comment:", error);

        if (error instanceof Error) {
            const statusCode =
                error.message === "Comment not found" ? 404 :
                    error.message === "You can only delete your own comments" ? 403 :
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