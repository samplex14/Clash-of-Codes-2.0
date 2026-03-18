import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; leaderboardVisible?: boolean; leaderboard?: Array<{ rank: number; usn: string; name: string; score: number; qualified: boolean }> }>> {
  try {
    const state = await getOrCreateTournamentState();
    if (!state.leaderboardVisible) {
      return NextResponse.json({ error: "Leaderboard locked", leaderboardVisible: false }, { status: 403 });
    }

    const participants = await db.participant.findMany({
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
      select: {
        usn: true,
        name: true,
        phase1Score: true,
        qualified: true
      }
    });

    const leaderboard = participants.map((participant, index) => ({
      rank: index + 1,
      usn: participant.usn,
      name: participant.name,
      score: participant.phase1Score,
      qualified: participant.qualified
    }));

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
