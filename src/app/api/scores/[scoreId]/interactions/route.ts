import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import { ScoreInteractionService } from "@/services/score-interaction-service";

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

        const interactions = await ScoreInteractionService.getInteractionsForScore(
            params.scoreId,
            session.user.id
        );

        return NextResponse.json({ interactions }, { status: 200 });
    } catch (error) {
        console.error("Error fetching interactions:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}