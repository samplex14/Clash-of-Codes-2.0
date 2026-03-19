import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

const TOP_QUALIFIED_COUNT = 8;

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; leaderboardVisible?: boolean; leaderboard?: Array<{ rank: number; usn: string; name: string; score: number; qualified: boolean }> }>> {
  try {
    const state = await getOrCreateTournamentState();
    if (!state.leaderboardVisible) {
      return NextResponse.json({ error: "Leaderboard locked", leaderboardVisible: false }, { status: 403 });
    }

    const participants = await db.participant.findMany({
      where: {
        submittedAt: {
          not: null
        }
      },
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        usn: true,
        name: true,
        phase1Score: true
      }
    });

    const qualifiedIds = new Set(participants.slice(0, TOP_QUALIFIED_COUNT).map((participant) => participant.id));

    const leaderboard = participants.map((participant, index) => ({
      rank: index + 1,
      usn: participant.usn,
      name: participant.name,
      score: participant.phase1Score,
      qualified: qualifiedIds.has(participant.id)
    }));

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
