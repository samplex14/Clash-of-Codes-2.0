import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureParticipantSession, getConfirmedAnswersMap } from "@/lib/phase1Session";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

interface ConfirmBody {
  usn?: string;
  questionId?: string;
  selectedOptionId?: string;
}

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ error?: string; confirmedAnswers?: Record<string, string> }>> {
  try {
    const body = (await request.json()) as ConfirmBody;
    const usn = normalizeUsn(String(body.usn ?? ""));
    const questionId = String(body.questionId ?? "").trim();
    const selectedOptionId = String(body.selectedOptionId ?? "").trim();

    if (!usn || !questionId || !selectedOptionId) {
      return NextResponse.json({ error: "usn, questionId, and selectedOptionId are required" }, { status: 400 });
    }

    const state = await getOrCreateTournamentState();
    if (!state.phase1Active) {
      return NextResponse.json({ error: "The battle horn has not sounded yet." }, { status: 403 });
    }

    const participant = await db.participant.findUnique({ where: { usn }, select: { usn: true } });
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const session = await ensureParticipantSession(usn);
    const confirmedAnswers = getConfirmedAnswersMap(session.confirmedAnswers);
    confirmedAnswers[questionId] = selectedOptionId;

    const updated = await db.participantSession.update({
      where: { usn },
      data: {
        confirmedAnswers
      },
      select: {
        confirmedAnswers: true
      }
    });

    return NextResponse.json({
      confirmedAnswers: getConfirmedAnswersMap(updated.confirmedAnswers)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected confirm error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
