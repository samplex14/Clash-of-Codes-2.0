import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SubmitBody {
  usn?: string;
  answers?: Array<{ questionId: string; selectedOptionId: string }>;
}

const normalizeUsn = (value: string): string => value.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; score?: number; total?: number; error?: string }>> {
  try {
    const body = (await request.json()) as SubmitBody;
    if (!body.usn || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "usn and answers are required" }, { status: 400 });
    }

    const activeSession = await db.phase1Session.findFirst({
      where: {
        status: "active"
      },
      orderBy: {
        id: "desc"
      }
    });

    if (!activeSession) {
      return NextResponse.json({ error: "Phase 1 not active" }, { status: 403 });
    }

    const usn = normalizeUsn(body.usn);
    const participant = await db.participant.findUnique({ where: { usn } });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (participant.submittedAt) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const questions = await db.question.findMany({ orderBy: { id: "asc" } });
    const answersByQuestionId = new Map(body.answers.map((entry) => [entry.questionId, entry.selectedOptionId]));

    let score = 0;
    for (const question of questions) {
      const selectedOptionId = answersByQuestionId.get(String(question.id));
      if (selectedOptionId === question.correctOptionId) {
        score += 1;
      }
    }

    await db.participant.update({
      where: { usn },
      data: {
        phase1Score: score,
        submittedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      score,
      total: questions.length
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
