import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: {
    usn: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse<{ error?: string; participant?: unknown }>> {
  try {
    const participant = await db.participant.findUnique({
      where: {
        usn: params.usn.trim().toUpperCase()
      }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({ participant });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
