import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";

export const dynamic = "force-dynamic";

const runQualificationIfNeeded = async (): Promise<void> => {
  const alreadyQualified = await db.participant.count({ where: { qualified: true } });
  if (alreadyQualified > 0) {
    return;
  }

  const sessions = await db.participantSession.findMany({
    where: { hasSubmitted: true },
    select: { usn: true }
  });

  if (sessions.length === 0) {
    return;
  }

  const submittedParticipants = await db.participant.findMany({
    where: {
      usn: {
        in: sessions.map((session) => session.usn)
      }
    },
    orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }]
  });

  const topEightUsnSet = new Set(submittedParticipants.slice(0, 8).map((participant) => participant.usn));

  await db.$transaction([
    db.participant.updateMany({ data: { qualified: false } }),
    db.participant.updateMany({
      where: {
        usn: {
          in: Array.from(topEightUsnSet)
        }
      },
      data: {
        qualified: true
      }
    }),
    db.tournamentState.upsert({
      where: { id: 1 },
      update: {
        leaderboardVisible: true,
        phase1Active: false,
        phase1EndedAt: new Date()
      },
      create: {
        id: 1,
        phase1Active: false,
        phase1EndedAt: new Date(),
        leaderboardVisible: true
      }
    })
  ]);

};

export async function GET(
  _request: NextRequest
): Promise<NextResponse<{ error?: string; submitted?: number; total?: number; allDone?: boolean; leaderboardVisible?: boolean }>> {
  try {
    const state = await getOrCreateTournamentState();

    const total = await db.participant.count({
      where: {
        isMapped: true,
        mappedTo: {
          not: null
        },
        NOT: {
          mappedTo: "WAITING_FOR_OPPONENT"
        }
      }
    });

    const submittedSessions = await db.participantSession.count({
      where: {
        hasSubmitted: true
      }
    });

    const submitted = Math.min(submittedSessions, total);

    const allDone = total > 0 && submitted >= total;

    if (allDone && !state.leaderboardVisible) {
      await runQualificationIfNeeded();
    }

    const nextState = await getOrCreateTournamentState();

    return NextResponse.json({
      submitted,
      total,
      allDone,
      leaderboardVisible: nextState.leaderboardVisible
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected tournament status error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
