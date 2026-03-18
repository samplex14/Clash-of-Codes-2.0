import { NextRequest, NextResponse } from "next/server";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; phase1Active?: boolean; leaderboardVisible?: boolean }>> {
  try {
    const state = await getOrCreateTournamentState();
    return NextResponse.json({
      phase1Active: state.phase1Active,
      leaderboardVisible: state.leaderboardVisible
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected tournament state error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
