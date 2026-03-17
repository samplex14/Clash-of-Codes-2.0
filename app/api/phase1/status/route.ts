import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; status?: string; id?: number; startedAt?: Date | null; endedAt?: Date | null; createdAt?: Date }>> {
  try {
    const session = await db.phase1Session.findFirst({
      orderBy: {
        id: "desc"
      }
    });

    if (!session) {
      return NextResponse.json({ status: "idle" });
    }

    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
