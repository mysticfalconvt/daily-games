import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import db from "@/db";
import { ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] }, { status: 200 });
        }

        // Search for users by email, excluding the current user
        const searchResults = await db.query.users.findMany({
            where: (fields, { and, not, eq }) => and(
                ilike(fields.email, `%${query}%`),
                not(eq(fields.email, session.user.email!))
            ),
            columns: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            limit: 10,
        });

        return NextResponse.json({ users: searchResults }, { status: 200 });
    } catch (error) {
        console.error("Error searching users:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}