import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; session?: unknown; error?: string }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.phase1Session.updateMany({
      where: {
        status: "active"
      },
      data: {
        status: "ended",
        endedAt: new Date()
      }
    });

    const session = await db.phase1Session.create({
      data: {
        status: "active",
        startedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
