import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";
import type { Phase1SubmitResponse, SubmitPayload } from "@/types";

export const dynamic = "force-dynamic";

const normalizeUsn = (value: string): string => value.trim().toUpperCase();

const getPhase1TimeLimitMinutes = (): number => {
  const raw = Number(process.env.PHASE1_TIME_LIMIT_MINUTES ?? "60");
  if (!Number.isFinite(raw) || raw <= 0) {
    return 60;
  }

  return Math.floor(raw);
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<Phase1SubmitResponse | { error: string }>> {
  const limitMinutes = getPhase1TimeLimitMinutes();
  let normalizedUsn: string | null = null;

  try {
    const body = (await request.json()) as Partial<SubmitPayload>;
    if (!body.usn || !body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
      return NextResponse.json({ error: "usn and answers are required" }, { status: 400 });
    }
    const autoSubmitted = body.autoSubmitted === true;

    const state = await getOrCreateTournamentState();
    if (!state.phase1Active) {
      return NextResponse.json({ error: "The battle horn has not sounded yet." }, { status: 403 });
    }

    const usn = normalizeUsn(body.usn);
    normalizedUsn = usn;
    const submittedAnswers = Object.entries(body.answers).reduce<Record<string, string>>((acc, [questionId, selectedOptionId]) => {
      if (typeof selectedOptionId === "string") {
        acc[String(questionId)] = selectedOptionId;
      }
      return acc;
    }, {});

    const participant = await db.participant.findUnique({
      where: { usn },
      select: {
        usn: true,
        year: true,
        track: true,
        phase1Score: true,
        session: {
          select: {
            shuffledQuestionIds: true,
            hasSubmitted: true,
            createdAt: true
          }
        }
      }
    });

    if (!participant || !participant.session) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const participantYear = participant.year || (participant.track === "1st_year" ? "1st" : "2nd");

    if (participant.session.hasSubmitted) {
      return NextResponse.json({
        success: true,
        score: participant.phase1Score,
        year: participantYear
      });
    }

    const shuffledQuestionIds = Array.isArray(participant.session.shuffledQuestionIds)
      ? participant.session.shuffledQuestionIds.map((id) => String(id))
      : [];

    if (shuffledQuestionIds.length === 0) {
      return NextResponse.json({ error: "No question order found for this participant" }, { status: 400 });
    }

    const submittedQuestionIds = Object.keys(submittedAnswers);
    const submittedSet = new Set<string>(submittedQuestionIds);
    const expectedSet = new Set<string>(shuffledQuestionIds);

    if (submittedSet.size !== submittedQuestionIds.length) {
      return NextResponse.json({ error: "Duplicate question IDs in answers are not allowed" }, { status: 400 });
    }

    const extraQuestionIds = submittedQuestionIds.filter((questionId) => !expectedSet.has(questionId));
    if (extraQuestionIds.length > 0) {
      return NextResponse.json({ error: `Unexpected question IDs: ${extraQuestionIds.join(", ")}` }, { status: 400 });
    }

    if (!autoSubmitted) {
      const missingQuestionIds = shuffledQuestionIds.filter((questionId) => !submittedSet.has(questionId));
      if (missingQuestionIds.length > 0) {
        return NextResponse.json({ error: `Missing question IDs: ${missingQuestionIds.join(", ")}` }, { status: 400 });
      }
    }

    const submissionDeadline = participant.session.createdAt.getTime() + limitMinutes * 60 * 1000;
    if (Date.now() > submissionDeadline && !autoSubmitted) {
      return NextResponse.json({ error: "The submission window has closed." }, { status: 403 });
    }

    const numericQuestionIds = Array.from(
      new Set(
        shuffledQuestionIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id))
      )
    );

    if (numericQuestionIds.length === 0) {
      return NextResponse.json({ error: "No valid question IDs found for this participant" }, { status: 400 });
    }

    const questions = await db.question.findMany({
      where: {
        id: {
          in: numericQuestionIds
        }
      },
      orderBy: { id: "asc" }
    });

    const correctByQuestionId = new Map(questions.map((question) => [String(question.id), question.correctOptionId]));

    let finalScore = 0;
    submittedQuestionIds.forEach((questionId) => {
      if (submittedAnswers[questionId] === correctByQuestionId.get(questionId)) {
        finalScore += 1;
      }
    });

    const submittedAt = new Date();
    await db.$transaction(async (tx) => {
      const sessionUpdate = await tx.participantSession.updateMany({
        where: {
          usn,
          hasSubmitted: false
        },
        data: {
          confirmedAnswers: submittedAnswers,
          hasSubmitted: true,
          submittedAt
        }
      });

      if (sessionUpdate.count === 0) {
        throw new Error("Already submitted");
      }

      const participantUpdate = await tx.participant.updateMany({
        where: {
          usn,
          submittedAt: null
        },
        data: {
          phase1Score: finalScore,
          submittedAt
        }
      });

      if (participantUpdate.count === 0) {
        throw new Error("Already submitted");
      }
    });

    const persisted = await db.participant.findUnique({
      where: { usn },
      select: {
        phase1Score: true,
        session: {
          select: {
            hasSubmitted: true
          }
        }
      }
    });

    if (!persisted?.session?.hasSubmitted || persisted.phase1Score === null || !Number.isInteger(persisted.phase1Score)) {
      console.error("Submission persistence mismatch", { usn, persisted });
      return NextResponse.json({ error: "Submission persistence verification failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score: persisted.phase1Score,
      year: participantYear
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Already submitted") {
      const fallbackUsn = normalizedUsn;
      if (fallbackUsn) {
        const persistedParticipant = await db.participant.findUnique({
          where: { usn: fallbackUsn },
          select: {
            phase1Score: true,
            year: true,
            track: true,
            session: {
              select: {
                hasSubmitted: true
              }
            }
          }
        });

        if (persistedParticipant?.session?.hasSubmitted && persistedParticipant.phase1Score !== null) {
          return NextResponse.json({
            success: true,
            score: persistedParticipant.phase1Score,
            year: persistedParticipant.year || (persistedParticipant.track === "1st_year" ? "1st" : "2nd")
          });
        }
      }

      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
