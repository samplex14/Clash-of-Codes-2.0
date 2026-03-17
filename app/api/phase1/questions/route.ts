import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseQuestionOptions } from "@/types/question";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; questions?: unknown[] }>> {
  try {
    const session = await db.phase1Session.findFirst({
      where: {
        status: "active"
      },
      orderBy: {
        id: "desc"
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Phase 1 not active" }, { status: 403 });
    }

    const questions = await db.question.findMany({ orderBy: { id: "asc" } });

    const safeQuestions = questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      options: parseQuestionOptions(question.options),
      matchRound: question.matchRound,
      createdAt: question.createdAt
    }));

    return NextResponse.json({ questions: safeQuestions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
