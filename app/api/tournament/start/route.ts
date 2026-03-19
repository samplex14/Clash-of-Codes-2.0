import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preloadMappedParticipantSessions } from "@/lib/phase1Session";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; success?: boolean; phase1Active?: boolean }>> {
  try {
    const existingState = await db.tournamentState.findUnique({
      where: { id: 1 },
      select: { phase1Active: true }
    });

    if (existingState?.phase1Active) {
      return NextResponse.json({ success: true, phase1Active: true });
    }

    const startedAt = new Date();

    await db.tournamentState.upsert({
      where: { id: 1 },
      update: {
        phase1Active: true,
        phase1StartedAt: startedAt,
        phase1EndedAt: null,
        leaderboardVisible: false
      },
      create: {
        id: 1,
        phase1Active: true,
        phase1StartedAt: startedAt,
        phase1EndedAt: null,
        leaderboardVisible: false
      }
    });

    await preloadMappedParticipantSessions();

    return NextResponse.json({ success: true, phase1Active: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected tournament start error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
