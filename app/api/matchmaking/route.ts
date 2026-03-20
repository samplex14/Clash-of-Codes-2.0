import { NextRequest, NextResponse } from "next/server";
import { assignMatchForParticipant, WAITING_FOR_OPPONENT } from "@/lib/matchmaking";
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
      select: { usn: true, year: true, mappedTo: true, mappedAt: true, isMapped: true }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (participant.isMapped && participant.mappedTo && participant.mappedTo !== WAITING_FOR_OPPONENT) {
      const opponent = await db.participant.findUnique({
        where: { usn: participant.mappedTo },
        select: { usn: true, name: true }
      });

      if (opponent) {
        return NextResponse.json({
          status: "matched",
          opponent,
          matchedAt: (participant.mappedAt ?? new Date()).toISOString()
        });
      }
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

    return NextResponse.json({
      status: "waiting",
      message: "No rival available yet. Hold your ground, Warrior."
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected matchmaking error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
