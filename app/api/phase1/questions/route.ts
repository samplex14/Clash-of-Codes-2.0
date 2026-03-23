import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";
import { getQuestionsForParticipant } from "@/lib/phase1Session";

export const dynamic = "force-dynamic";

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

const getPhase1TimeLimitMinutes = (): number => {
  const raw = Number(process.env.PHASE1_TIME_LIMIT_MINUTES ?? "30");
  if (!Number.isFinite(raw) || raw <= 0) {
    return 30;
  }

  return 30;
};

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<{
    error?: string;
    questions?: Array<{ questionId: string; text: string; options: Array<{ id: string; text: string }> }>;
    timeLimitMinutes?: number;
    sessionCreatedAt?: string;
  }>
> {
  try {
    const usn = normalizeUsn(String(request.nextUrl.searchParams.get("usn") ?? ""));
    if (!usn) {
      return NextResponse.json({ error: "usn query parameter is required" }, { status: 400 });
    }

    const state = await getOrCreateTournamentState();
    if (!state.phase1Active) {
      return NextResponse.json({ error: "The battle horn has not sounded yet." }, { status: 403 });
    }

    const participant = await db.participant.findUnique({ where: { usn }, select: { usn: true, year: true } });
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const questions = await getQuestionsForParticipant(usn, participant.year);

    const session = await db.participantSession.findUnique({
      where: { usn },
      select: { createdAt: true }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const timeLimitMinutes = getPhase1TimeLimitMinutes();

    return NextResponse.json({
      questions,
      timeLimitMinutes,
      sessionCreatedAt: session.createdAt.toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
