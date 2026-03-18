import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureParticipantSession, getConfirmedAnswersMap } from "@/lib/phase1Session";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

interface SubmitBody {
  usn?: string;
  lastQuestionId?: string;
  lastSelectedOptionId?: string;
}

const normalizeUsn = (value: string): string => value.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; score?: number; total?: number; error?: string }>> {
  try {
    const body = (await request.json()) as SubmitBody;
    if (!body.usn || !body.lastQuestionId || !body.lastSelectedOptionId) {
      return NextResponse.json({ error: "usn, lastQuestionId, and lastSelectedOptionId are required" }, { status: 400 });
    }

    const state = await getOrCreateTournamentState();
    if (!state.phase1Active) {
      return NextResponse.json({ error: "The battle horn has not sounded yet." }, { status: 403 });
    }

    const usn = normalizeUsn(body.usn);
    const participant = await db.participant.findUnique({ where: { usn } });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (participant.submittedAt) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const session = await ensureParticipantSession(usn);
    if (session.hasSubmitted) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const shuffledQuestionIds = Array.isArray(session.shuffledQuestionIds)
      ? session.shuffledQuestionIds.map((id) => String(id))
      : [];

    if (shuffledQuestionIds.length === 0) {
      return NextResponse.json({ error: "No question order found for this participant" }, { status: 400 });
    }

    const confirmedAnswers = getConfirmedAnswersMap(session.confirmedAnswers);
    const lastQuestionId = String(body.lastQuestionId);
    const lastSelectedOptionId = String(body.lastSelectedOptionId);

    const expectedLastQuestionId = shuffledQuestionIds[shuffledQuestionIds.length - 1];
    if (lastQuestionId !== expectedLastQuestionId) {
      return NextResponse.json({ error: "Final strike must target the last question." }, { status: 400 });
    }

    const priorQuestionIds = shuffledQuestionIds.slice(0, -1);
    const missingQuestions = priorQuestionIds.filter((questionId) => !confirmedAnswers[questionId]);
    if (missingQuestions.length > 0) {
      return NextResponse.json(
        { error: `Unconfirmed questions: ${missingQuestions.join(", ")}` },
        { status: 400 }
      );
    }

    confirmedAnswers[lastQuestionId] = lastSelectedOptionId;

    const questions = await db.question.findMany({ orderBy: { id: "asc" } });
    const correctByQuestionId = new Map(questions.map((question) => [String(question.id), question.correctOptionId]));

    let score = 0;
    shuffledQuestionIds.forEach((questionId) => {
      if (confirmedAnswers[questionId] === correctByQuestionId.get(questionId)) {
        score += 1;
      }
    });

    const submittedAt = new Date();
    await db.$transaction([
      db.participant.update({
        where: { usn },
        data: {
          phase1Score: score,
          submittedAt
        }
      }),
      db.participantSession.update({
        where: { usn },
        data: {
          confirmedAnswers,
          hasSubmitted: true,
          submittedAt
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      score,
      total: shuffledQuestionIds.length
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
