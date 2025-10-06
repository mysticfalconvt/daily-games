import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { FriendService } from "@/services/friend-service";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Bad Request", message: "Email is required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Bad Request", message: "Invalid email format" },
                { status: 400 }
            );
        }

        await FriendService.sendFriendRequest(session.user.email, email);

        return NextResponse.json(
            { message: "Friend request sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending friend request:", error);

        if (error instanceof Error) {
            // Handle specific error messages from the service
            const statusCode =
                error.message === "User not found" ? 404 :
                    error.message === "Cannot add yourself as a friend" ? 400 :
                        error.message === "Already friends with this user" ? 409 :
                            error.message === "Friend request already sent" ? 409 :
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