import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
import type { TournamentStatusResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<TournamentStatusResponse | { error: string }>> {
  try {
    const total = await db.participant.count({
      where: {
        isMapped: true
      }
    });

    const submitted = await db.participant.count({
      where: {
        isMapped: true,
        submittedAt: {
          not: null
        }
      }
    });

    let state = await db.tournamentState.findUnique({
      where: { id: 1 },
      select: { leaderboardVisible: true }
    });

    if (!state) {
      state = await db.tournamentState
        .create({
          data: {
            id: 1,
            phase1Active: false,
            leaderboardVisible: false
          },
          select: { leaderboardVisible: true }
        })
        .catch(async () =>
          db.tournamentState.findUnique({
            where: { id: 1 },
            select: { leaderboardVisible: true }
          })
        );
    }

    if (state?.leaderboardVisible) {
      return NextResponse.json({
        submitted,
        total,
        allDone: true,
        leaderboardVisible: true
      });
    }

    const allDone = total > 0 && submitted === total;

    if (allDone) {
      await db.$transaction(async (tx) => {
        const freshState = await tx.tournamentState.findUnique({
          where: { id: 1 },
          select: { leaderboardVisible: true }
        });

        if (freshState?.leaderboardVisible) {
          return;
        }

        const rankedParticipants = await tx.participant.findMany({
          where: {
            isMapped: true,
            submittedAt: {
              not: null
            }
          },
          orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
          select: {
            id: true
          }
        });

        const qualifiedIds = rankedParticipants.slice(0, TOP_QUALIFIED_COUNT).map((participant) => participant.id);

        await tx.participant.updateMany({
          where: {
            isMapped: true
          },
          data: {
            qualified: false
          }
        });

        if (qualifiedIds.length > 0) {
          await tx.participant.updateMany({
            where: {
              id: {
                in: qualifiedIds
              }
            },
            data: {
              qualified: true
            }
          });
        }

        await tx.tournamentState.upsert({
          where: { id: 1 },
          update: {
            leaderboardVisible: true,
            phase1Active: false,
            phase1EndedAt: new Date()
          },
          create: {
            id: 1,
            phase1Active: false,
            leaderboardVisible: true,
            phase1EndedAt: new Date()
          }
        });
      });

      return NextResponse.json({
        submitted,
        total,
        allDone: true,
        leaderboardVisible: true
      });
    }

    return NextResponse.json({
      submitted,
      total,
      allDone,
      leaderboardVisible: false
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected tournament status error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
