import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTournamentState } from "@/lib/tournamentState";
import { TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
import type { LeaderboardResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
): Promise<NextResponse<LeaderboardResponse | { visible: false; message: string } | { error: string }>> {
  try {
    const state = await getOrCreateTournamentState();
    if (!state.leaderboardVisible) {
      return NextResponse.json({ visible: false, message: "Tournament not yet complete" }, { status: 403 });
    }

    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? "50"), 1), 150);
    const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") ?? "0"), 0);
    const year: string | null = request.nextUrl.searchParams.get("year");
    const trackFilter = year === "1st" ? "1st_year" : year === "2nd" ? "2nd_year" : null;
    const whereClause = {
      isMapped: true,
      phase1Score: {
        gte: 0
      },
      ...(trackFilter ? { track: trackFilter } : {}),
      session: {
        is: {
          hasSubmitted: true
        }
      }
    };

    const allEligibleParticipants = await db.participant.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            hasSubmitted: true,
            submittedAt: true
          }
        }
      },
      orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }]
    });

    const total = allEligibleParticipants.length;
    const pagedParticipants = allEligibleParticipants.slice(offset, offset + limit);
    const qualifiedTopParticipants = allEligibleParticipants.slice(0, TOP_QUALIFIED_COUNT);
    const qualifiedUsns = new Set(qualifiedTopParticipants.map((participant) => participant.usn));

    const totalRegistered = await db.participant.count({
      where: {
        isMapped: true,
        ...(trackFilter ? { track: trackFilter } : {})
      }
    });

    const rankedParticipants = pagedParticipants.map((participant, index) => ({
      rank: offset + index + 1,
      name: participant.name,
      usn: participant.usn,
      phase1Score: participant.phase1Score,
      qualified: qualifiedUsns.has(participant.usn),
      hasSubmitted: true as const,
      submittedAt: participant.session?.submittedAt
        ? participant.session.submittedAt.toISOString()
        : new Date(0).toISOString()
    }));

    const qualifiedParticipants = qualifiedTopParticipants.map((participant, index) => ({
      rank: index + 1,
      name: participant.name,
      usn: participant.usn,
      phase1Score: participant.phase1Score,
      qualified: true,
      hasSubmitted: true as const,
      submittedAt: participant.session?.submittedAt
        ? participant.session.submittedAt.toISOString()
        : new Date(0).toISOString()
    }));

    return NextResponse.json({
      visible: true,
      participants: rankedParticipants,
      qualifiedParticipants,
      total,
      limit,
      offset,
      totalEligible: total,
      totalRegistered
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
