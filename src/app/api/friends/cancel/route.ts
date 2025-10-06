import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { FriendService } from "@/services/friend-service";

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { requestId } = body;

        if (!requestId || typeof requestId !== "string") {
            return NextResponse.json(
                { error: "Bad Request", message: "Request ID is required" },
                { status: 400 }
            );
        }

        await FriendService.cancelFriendRequest(requestId, session.user.id);

        return NextResponse.json(
            { message: "Friend request cancelled successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error cancelling friend request:", error);

        if (error instanceof Error) {
            const statusCode =
                error.message === "Friend request not found or not authorized" ? 404 : 500;

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