import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";
import { getSubmittedParticipants, TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
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

    // Submitted-only leaderboard rule: fetch from shared helper that enforces DB-level eligibility.
    const participants = await getSubmittedParticipants();

    // Safety net: API response also re-checks the submitted-only rule before serialization.
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

    const rankedParticipants = eligible.map((participant, index) => ({
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
    }));

    return NextResponse.json({
      visible: true,
      participants: rankedParticipants,
      totalEligible: rankedParticipants.length,
      totalRegistered
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
