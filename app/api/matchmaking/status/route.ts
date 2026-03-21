import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SAMPLE_OPPONENTS } from "@/prisma/samplenames";

export const dynamic = "force-dynamic";

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string; isMapped?: boolean; mappedTo?: string | null; opponentName?: string | null }>> {
  try {
    const usnParam = request.nextUrl.searchParams.get("usn");
    const usn = normalizeUsn(String(usnParam ?? ""));

    if (!usn) {
      return NextResponse.json({ error: "usn query parameter is required" }, { status: 400 });
    }

    const participant = await db.participant.findUnique({
      where: { usn },
      select: { isMapped: true, mappedTo: true }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    let opponentName: string | null = null;
    if (participant.mappedTo && participant.mappedTo !== "WAITING_FOR_OPPONENT") {
      const opponent = await db.participant.findUnique({
        where: { usn: participant.mappedTo },
        select: { name: true }
      });
      if (opponent?.name) {
        opponentName = opponent.name;
      } else {
        const botOpponent = SAMPLE_OPPONENTS.find((sample) => sample.usn === participant.mappedTo);
        opponentName = botOpponent?.name ?? null;
      }
    }

    return NextResponse.json({
      isMapped: participant.isMapped,
      mappedTo: participant.mappedTo,
      opponentName
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected matchmaking status error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
