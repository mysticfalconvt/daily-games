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
        const { friendId } = body;

        if (!friendId || typeof friendId !== "string") {
            return NextResponse.json(
                { error: "Bad Request", message: "Friend ID is required" },
                { status: 400 }
            );
        }

        await FriendService.removeFriend(session.user.id, friendId);

        return NextResponse.json(
            { message: "Friend removed successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error removing friend:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}