import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { TOP_QUALIFIED_COUNT, computePhase1Qualification } from "@/lib/phase1Qualification";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; message?: string; qualifiedCount?: number; submittedCount?: number; error?: string }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await db.phase1Session.findFirst({
      where: {
        status: "active"
      },
      orderBy: {
        id: "desc"
      }
    });

    if (!session) {
      return NextResponse.json({ error: "No active Phase 1 session" }, { status: 400 });
    }

    await db.phase1Session.update({
      where: { id: session.id },
      data: {
        status: "ended",
        endedAt: new Date()
      }
    });

    const { qualifiedCount, submittedCount } = await computePhase1Qualification();

    return NextResponse.json({
      success: true,
      message: `Phase 1 ended. Top ${TOP_QUALIFIED_COUNT} qualified.`,
      qualifiedCount,
      submittedCount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
