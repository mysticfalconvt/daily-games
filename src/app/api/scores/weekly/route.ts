import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { ScoreFilterService } from "@/services/score-filter-service";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const showAllUsers = searchParams.get("showAllUsers") === "true";

        const scores = await ScoreFilterService.getWeeklyFilteredScores(session.user.id, showAllUsers);
        const hasFriends = !(await ScoreFilterService.shouldShowAllUsers(session.user.id));

        return NextResponse.json({ scores, hasFriends }, { 
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
    } catch (error) {
        console.error("Error fetching weekly scores:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}
