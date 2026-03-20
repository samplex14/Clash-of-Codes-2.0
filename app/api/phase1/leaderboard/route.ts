import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSubmittedParticipants, TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
import type { LeaderboardResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<LeaderboardResponse | { error: string }>> {
  try {
    // Submitted-only leaderboard rule: phase leaderboard always starts from submitted-only DB query helper.
    const participants = await getSubmittedParticipants();

    // Safety net: response payload is explicitly re-filtered before returning to clients.
    const eligible = participants.filter(
      (participant) =>
        participant.session.hasSubmitted === true &&
        participant.phase1Score !== null &&
        Number.isInteger(participant.phase1Score)
    );

    const totalRegistered = await db.participant.count({
      where: {
        isMapped: true
      }
    });

    return NextResponse.json({
      visible: true,
      participants: eligible.map((participant, index) => ({
        rank: index + 1,
        name: participant.name,
        usn: participant.usn,
        phase1Score: participant.phase1Score,
        // Leaderboard rule: top 8 are qualified, all others are eliminated.
        qualified: index < TOP_QUALIFIED_COUNT,
        hasSubmitted: true as const,
        submittedAt: participant.session.submittedAt
          ? participant.session.submittedAt.toISOString()
          : new Date(0).toISOString()
      })),
      totalEligible: eligible.length,
      totalRegistered
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}