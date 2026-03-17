import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string; participants?: unknown[] }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participants = await db.participant.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ participants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
