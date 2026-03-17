import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface LeaderboardParticipant {
  usn: string;
  name: string;
  phase1Score: number;
  track: string;
  qualified: boolean;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string; leaderboard?: Array<{ rank: number; usn: string; name: string; score: number; track: string; qualified: boolean }> }>> {
  try {
    const scope = String(request.nextUrl.searchParams.get("scope") ?? "all").toLowerCase();

    const participants = (await db.participant.findMany({
      where: scope === "qualified" ? { qualified: true } : undefined,
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }]
    })) as LeaderboardParticipant[];

    const leaderboard = participants.map((participant: LeaderboardParticipant, index: number) => ({
      rank: index + 1,
      usn: participant.usn,
      name: participant.name,
      score: participant.phase1Score,
      track: participant.track,
      qualified: participant.qualified
    }));

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
