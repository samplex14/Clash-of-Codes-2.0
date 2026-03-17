import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse<{ success?: boolean; error?: string }>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const existing = await db.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await db.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
