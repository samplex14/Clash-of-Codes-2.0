import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RegisterBody {
  usn?: string;
  fullName?: string;
  year?: "1st" | "2nd";
}

const normalizeUsn = (value: string): string => value.trim().toUpperCase();
const usnPattern = /^[A-Z0-9]{6,20}$/;

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success?: boolean; participant?: { usn: string; name: string; track: string }; error?: string }>> {
  try {
    const body = (await request.json()) as RegisterBody;

    const usn = normalizeUsn(String(body.usn ?? ""));
    const fullName = String(body.fullName ?? "").trim();
    const year = body.year;

    if (!usn || !fullName || !year) {
      return NextResponse.json({ error: "usn, fullName, and year are required" }, { status: 400 });
    }

    if (!usnPattern.test(usn)) {
      return NextResponse.json({ error: "Invalid USN format" }, { status: 400 });
    }

    if (fullName.length < 2 || fullName.length > 60) {
      return NextResponse.json({ error: "name must be between 2 and 60 characters" }, { status: 400 });
    }

    if (year !== "1st" && year !== "2nd") {
      return NextResponse.json({ error: "year must be '1st' or '2nd'" }, { status: 400 });
    }

    const existing = await db.participant.findUnique({ where: { usn } });
    if (existing) {
      return NextResponse.json({ error: "USN already registered" }, { status: 400 });
    }

    const participant = await db.participant.create({
      data: {
        usn,
        name: fullName,
        year,
        track: year === "1st" ? "1st_year" : "2nd_year"
      },
      select: {
        usn: true,
        name: true,
        track: true
      }
    });

    return NextResponse.json({ success: true, participant }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected registration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
