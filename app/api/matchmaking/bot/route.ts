import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SAMPLE_OPPONENTS } from "@/prisma/samplenames";
import { WAITING_FOR_OPPONENT } from "@/lib/matchmaking";

export const dynamic = "force-dynamic";

interface BotMatchmakingRequestBody {
  usn: string;
}

interface BotMatchmakingSuccessResponse {
  success: boolean;
  opponentName: string;
  opponentUSN: string;
  isBot: boolean;
}

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ error: string } | BotMatchmakingSuccessResponse>> {
  try {
    const body = (await request.json()) as BotMatchmakingRequestBody;
    const usn = normalizeUsn(String(body.usn ?? ""));

    if (!usn) {
      return NextResponse.json({ error: "usn is required" }, { status: 400 });
    }

    const participant = await db.participant.findUnique({
      where: { usn },
      select: { usn: true, year: true, isMapped: true, mappedTo: true }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (
      participant.isMapped &&
      participant.mappedTo &&
      participant.mappedTo !== WAITING_FOR_OPPONENT
    ) {
      const realOpponent = await db.participant.findUnique({
        where: { usn: participant.mappedTo },
        select: { usn: true, name: true }
      });

      if (realOpponent) {
        return NextResponse.json({
          success: true,
          opponentName: realOpponent.name,
          opponentUSN: realOpponent.usn,
          isBot: false
        });
      }

      const existingBot = SAMPLE_OPPONENTS.find((opponent) => opponent.usn === participant.mappedTo);
      if (existingBot) {
        return NextResponse.json({
          success: true,
          opponentName: existingBot.name,
          opponentUSN: existingBot.usn,
          isBot: true
        });
      }

      return NextResponse.json({ error: "Mapped opponent not found" }, { status: 500 });
    }

    const yearMatchedOpponents = SAMPLE_OPPONENTS.filter((opponent) => opponent.year === participant.year);
    const botPool = yearMatchedOpponents.length > 0 ? yearMatchedOpponents : SAMPLE_OPPONENTS;
    const selectedBot = botPool[Math.floor(Math.random() * botPool.length)];

    await db.participant.update({
      where: { usn },
      data: {
        isMapped: true,
        mappedTo: selectedBot.usn,
        mappedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      opponentName: selectedBot.name,
      opponentUSN: selectedBot.usn,
      isBot: true
    });
  } catch {
    return NextResponse.json({ error: "Unexpected bot matchmaking error" }, { status: 500 });
  }
}
