import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ensureParticipantSession,
  getConfirmedAnswersMap,
  getSessionSubmissionStats,
  isSessionFullySubmitted
} from "@/lib/phase1Session";
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
): Promise<NextResponse<{ success?: boolean; score?: number; total?: number; year?: string; error?: string }>> {
  let normalizedUsn: string | null = null;

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
    normalizedUsn = usn;
    const participant = await db.participant.findUnique({ where: { usn } });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const participantYear = participant.year || (participant.track === "1st_year" ? "1st" : "2nd");

    const session = await ensureParticipantSession(usn);
    const existingSubmissionStats = await getSessionSubmissionStats(usn);

    // Submitted-only leaderboard rule: submit endpoint is idempotent and returns persisted score for already-submitted sessions.
    if (existingSubmissionStats.hasSubmitted || (await isSessionFullySubmitted(usn))) {
      const totalQuestions = Array.isArray(session.shuffledQuestionIds) ? session.shuffledQuestionIds.length : 0;
      return NextResponse.json({
        success: true,
        score: existingSubmissionStats.phase1Score ?? participant.phase1Score,
        total: totalQuestions,
        year: participantYear
      });
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
    await db.$transaction(async (tx) => {
      const participantUpdate = await tx.participant.updateMany({
        where: {
          usn,
          submittedAt: null
        },
        data: {
          phase1Score: score,
          submittedAt
        }
      });

      if (participantUpdate.count === 0) {
        throw new Error("Already submitted");
      }

      const sessionUpdate = await tx.participantSession.updateMany({
        where: {
          usn,
          hasSubmitted: false
        },
        data: {
          confirmedAnswers,
          hasSubmitted: true,
          submittedAt
        }
      });

      if (sessionUpdate.count === 0) {
        throw new Error("Already submitted");
      }
    });

    // Submitted-only leaderboard rule: verify submit and score persistence before returning success.
    const persistedStats = await getSessionSubmissionStats(usn);
    if (!persistedStats.hasSubmitted || persistedStats.phase1Score === null || !Number.isInteger(persistedStats.phase1Score)) {
      console.error("Submission persistence mismatch", {
        usn,
        hasSubmitted: persistedStats.hasSubmitted,
        phase1Score: persistedStats.phase1Score
      });
      return NextResponse.json({ error: "Submission persistence verification failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score: persistedStats.phase1Score,
      total: shuffledQuestionIds.length,
      year: participantYear
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Already submitted") {
      if (normalizedUsn) {
        const persistedStats = await getSessionSubmissionStats(normalizedUsn);
        const persistedParticipant = await db.participant.findUnique({
          where: { usn: normalizedUsn },
          select: { year: true, track: true }
        });
        const persistedYear = persistedParticipant
          ? persistedParticipant.year || (persistedParticipant.track === "1st_year" ? "1st" : "2nd")
          : "2nd";

        if (persistedStats.hasSubmitted && persistedStats.phase1Score !== null) {
          return NextResponse.json({ success: true, score: persistedStats.phase1Score, total: 0, year: persistedYear });
        }
      }

      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
