import { NextRequest, NextResponse } from "next/server";
import { buildPhase1Leaderboard } from "@/lib/leaderboard";

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string; leaderboard?: Array<{ rank: number; usn: string; name: string; score: number; track: string; qualified: boolean }> }>> {
  try {
    const qualifiedOnly = String(request.nextUrl.searchParams.get("qualified") ?? "false").toLowerCase() === "true";
    const leaderboard = await buildPhase1Leaderboard(qualifiedOnly);
    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
