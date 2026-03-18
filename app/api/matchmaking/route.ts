import { NextRequest, NextResponse } from "next/server";
import { assignMatchForParticipant, type MatchmakingResult } from "@/lib/matchmaking";

interface MatchmakingRequestBody {
  usn: string;
}

interface MatchmakingSuccessResponse {
  status: "matched" | "waiting" | "retry";
  message?: string;
  queued?: boolean;
  opponent?: {
    name: string;
    usn: string;
  };
  matchedAt?: string;
}

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

const toResponse = (result: MatchmakingResult): MatchmakingSuccessResponse => {
  if (result.status === "matched") {
    return {
      status: "matched",
      opponent: {
        name: result.opponent.name,
        usn: result.opponent.usn
      },
      matchedAt: result.matchedAt.toISOString()
    };
  }

  if (result.status === "waiting") {
    return {
      status: "waiting",
      message: result.queueMessage,
      queued: true
    };
  }

  return {
    status: "retry",
    message: result.message
  };
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ error?: string } | MatchmakingSuccessResponse>> {
  try {
    const body = (await request.json()) as MatchmakingRequestBody;
    const usn = normalizeUsn(String(body.usn ?? ""));

    if (!usn) {
      return NextResponse.json({ error: "usn is required" }, { status: 400 });
    }

    const result = await assignMatchForParticipant(usn);
    return NextResponse.json(toResponse(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected matchmaking error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
