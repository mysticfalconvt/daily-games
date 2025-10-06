import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import options from "@/config/auth";
import { FriendService } from "@/services/friend-service";

export async function GET() {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const count = await FriendService.getPendingRequestCount(session.user.id);

        return NextResponse.json({ count }, { status: 200 });
    } catch (error) {
        console.error("Error fetching request count:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}