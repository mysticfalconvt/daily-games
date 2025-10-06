import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import options from "@/config/auth";
import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: {
                isPrivate: true,
            },
        });

        return NextResponse.json({ isPrivate: user?.isPrivate || false }, { status: 200 });
    } catch (error) {
        console.error("Error fetching privacy setting:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(options);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { isPrivate } = body;

        if (typeof isPrivate !== "boolean") {
            return NextResponse.json(
                { error: "Bad Request", message: "isPrivate must be a boolean" },
                { status: 400 }
            );
        }

        await db
            .update(users)
            .set({ isPrivate })
            .where(eq(users.id, session.user.id));

        return NextResponse.json(
            { message: "Privacy setting updated successfully", isPrivate },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating privacy setting:", error);

        return NextResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
        );
    }
}