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
        isMapped: true,
        track: "1st_year",
        phase1Score: {
          gte: 0
        },
        session: {
          is: {
            hasSubmitted: true
          }
        }
      },
      include: {
        session: {
          select: {
            hasSubmitted: true,
            submittedAt: true
          }
        }
      },
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }]
    });

    const eligible = participants.filter(
      (participant) =>
        participant.session?.hasSubmitted === true &&
        participant.phase1Score !== null &&
        Number.isInteger(participant.phase1Score)
    );

    const totalRegistered = await db.participant.count({
      where: {
        isMapped: true,
        track: "1st_year"
      }
    });

    const rankedParticipants = eligible.map((participant, index) => ({
      rank: index + 1,
      name: participant.name,
      usn: participant.usn,
      phase1Score: participant.phase1Score,
      qualified: index < TOP_QUALIFIED_COUNT,
      hasSubmitted: true as const,
      submittedAt: participant.session?.submittedAt
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
