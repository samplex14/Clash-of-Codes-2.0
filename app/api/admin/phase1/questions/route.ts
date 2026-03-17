import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { parseIncomingOptions, toPrismaJson } from "@/lib/questions";

interface AddQuestionBody {
  text?: string;
  options?: unknown;
  correctIndex?: number;
  correctOptionId?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; question?: unknown; error?: string }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AddQuestionBody;
    if (!body.text || body.options === undefined) {
      return NextResponse.json({ error: "text and options are required" }, { status: 400 });
    }

    const parsedOptions = parseIncomingOptions(body.options);
    if (parsedOptions.length < 2) {
      return NextResponse.json({ error: "At least two valid options are required" }, { status: 400 });
    }

    const fallbackOptionId =
      typeof body.correctIndex === "number" && parsedOptions[body.correctIndex]
        ? parsedOptions[body.correctIndex].optionId
        : null;

    const correctOptionId = body.correctOptionId ?? fallbackOptionId;

    if (!correctOptionId) {
      return NextResponse.json({ error: "correctOptionId or valid correctIndex is required" }, { status: 400 });
    }

    const question = await db.question.create({
      data: {
        questionText: body.text,
        options: toPrismaJson(parsedOptions),
        correctOptionId
      }
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string; questions?: unknown[] }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await db.question.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
