import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RegisterBody {
  usn?: string;
  name?: string;
  year?: number;
}

const normalizeUsn = (value: string): string => value.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; participant?: unknown; error?: string }>> {
  try {
    const body = (await request.json()) as RegisterBody;
    if (!body.usn || !body.name || typeof body.year !== "number") {
      return NextResponse.json({ error: "usn, name, and year are required" }, { status: 400 });
    }

    if (body.year !== 1 && body.year !== 2) {
      return NextResponse.json({ error: "year must be 1 or 2" }, { status: 400 });
    }

    const usn = normalizeUsn(body.usn);
    const existing = await db.participant.findUnique({ where: { usn } });

    if (existing) {
      return NextResponse.json({ error: "USN already registered" }, { status: 400 });
    }

    const participant = await db.participant.create({
      data: {
        usn,
        name: body.name.trim(),
        track: body.year === 1 ? "1st_year" : "2nd_year"
      }
    });

    return NextResponse.json({ success: true, participant }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected registration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
