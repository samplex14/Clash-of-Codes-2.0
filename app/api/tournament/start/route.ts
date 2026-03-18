import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preloadMappedParticipantSessions } from "@/lib/phase1Session";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; success?: boolean; phase1Active?: boolean }>> {
  try {
    const state = await db.tournamentState.upsert({
      where: { id: 1 },
      update: {
        phase1Active: true
      },
      create: {
        id: 1,
        phase1Active: true,
        phase1StartedAt: new Date(),
        leaderboardVisible: false
      }
    });

    if (!state.phase1StartedAt) {
      await db.tournamentState.update({
        where: { id: 1 },
        data: {
          phase1StartedAt: new Date()
        }
      });
    }

    await preloadMappedParticipantSessions();

    return NextResponse.json({ success: true, phase1Active: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected tournament start error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
