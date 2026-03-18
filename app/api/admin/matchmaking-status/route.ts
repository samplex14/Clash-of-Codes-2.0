import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { WAITING_FOR_OPPONENT } from "@/lib/matchmaking";

interface MappedParticipantRow {
  usn: string;
  name: string;
  mappedTo: string | null;
}

interface PairItem {
  playerAUSN: string;
  playerAName: string;
  playerBUSN: string;
  playerBName: string;
}

interface MatchmakingStatusResponse {
  mappedCount: number;
  waitingCount: number;
  pairs: PairItem[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ error?: string } | MatchmakingStatusResponse>> {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mappedParticipants = await db.$queryRaw<MappedParticipantRow[]>`
      SELECT "usn", "name", "mappedTo"
      FROM "Participant"
      WHERE "isMapped" = true
      ORDER BY "usn" ASC
    `;

    const byUsn = new Map(mappedParticipants.map((participant) => [participant.usn, participant]));
    const pairKeys = new Set<string>();
    const pairs: PairItem[] = [];

    mappedParticipants.forEach((participant) => {
      if (!participant.mappedTo || participant.mappedTo === WAITING_FOR_OPPONENT) {
        return;
      }

      const opponent = byUsn.get(participant.mappedTo);
      if (!opponent || opponent.mappedTo !== participant.usn) {
        return;
      }

      const sorted = [participant.usn, opponent.usn].sort((a, b) => a.localeCompare(b));
      const key = sorted.join("|");

      if (pairKeys.has(key)) {
        return;
      }

      pairKeys.add(key);
      pairs.push({
        playerAUSN: participant.usn,
        playerAName: participant.name,
        playerBUSN: opponent.usn,
        playerBName: opponent.name
      });
    });

    const waitingCount = mappedParticipants.filter((participant) => participant.mappedTo === WAITING_FOR_OPPONENT).length;

    return NextResponse.json({
      mappedCount: mappedParticipants.length,
      waitingCount,
      pairs
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
