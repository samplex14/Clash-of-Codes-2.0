import { NextRequest, NextResponse } from "next/server";
import { assignMatchForParticipant } from "@/lib/matchmaking";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface MatchmakingRequestBody {
  usn: string;
}

interface MatchmakingSuccessResponse {
  status: "matched" | "waiting";
  message?: string;
  opponent?: {
    name: string;
    usn: string;
  };
  matchedAt?: string;
}

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ error?: string } | MatchmakingSuccessResponse>> {
  try {
    const body = (await request.json()) as MatchmakingRequestBody;
    const usn = normalizeUsn(String(body.usn ?? ""));

    if (!usn) {
      return NextResponse.json({ error: "usn is required" }, { status: 400 });
    }

    const participant = await db.participant.findUnique({
      where: { usn },
      select: { year: true }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const result = await assignMatchForParticipant(usn, participant.year);
    if (result.status === "matched") {
      return NextResponse.json({
        status: "matched",
        opponent: {
          name: result.opponent.name,
          usn: result.opponent.usn
        },
        matchedAt: result.matchedAt.toISOString()
      });
    }

    if (result.status === "retry") {
      return NextResponse.json({
        status: "waiting",
        message: result.message
      });
    }

    return NextResponse.json({
      status: "waiting",
      message: result.queueMessage
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected matchmaking error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
