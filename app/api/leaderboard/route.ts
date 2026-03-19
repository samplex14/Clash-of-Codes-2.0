import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";
import { TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
import type { LeaderboardResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<LeaderboardResponse | { visible: false; message: string } | { error: string }>> {
  try {
    const state = await getOrCreateTournamentState();
    if (!state.leaderboardVisible) {
      return NextResponse.json({ visible: false, message: "Tournament not yet complete" }, { status: 403 });
    }

    const participants = await db.participant.findMany({
      where: {
        isMapped: true
      },
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
      select: {
        name: true,
        usn: true,
        phase1Score: true,
        submittedAt: true
      }
    });

    const rankedParticipants = participants.map((participant, index) => ({
      rank: index + 1,
      name: participant.name,
      usn: participant.usn,
      phase1Score: participant.phase1Score,
      qualified: index < TOP_QUALIFIED_COUNT,
      submittedAt: participant.submittedAt ? participant.submittedAt.toISOString() : new Date(0).toISOString()
    }));

    return NextResponse.json({
      visible: true,
      participants: rankedParticipants
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
