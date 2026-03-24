import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TOP_QUALIFIED_COUNT } from "@/lib/phase1Qualification";
import type { TournamentStatusResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest
): Promise<NextResponse<TournamentStatusResponse | { error: string }>> {
  try {
    let state = await db.tournamentState.findUnique({
      where: { id: 1 },
      select: { leaderboardVisible: true, cachedSubmitted: true, cachedTotal: true }
    });

    if (state?.leaderboardVisible) {
      return NextResponse.json({
        submitted: state.cachedSubmitted ?? 0,
        total: state.cachedTotal ?? 0,
        allDone: true,
        leaderboardVisible: true
      });
    }

    if (!state) {
      state = await db.tournamentState
        .create({
          data: {
            id: 1,
            phase1Active: false,
            leaderboardVisible: false,
            cachedSubmitted: null,
            cachedTotal: null
          },
          select: { leaderboardVisible: true, cachedSubmitted: true, cachedTotal: true }
        })
        .catch(async () =>
          db.tournamentState.findUnique({
            where: { id: 1 },
            select: { leaderboardVisible: true, cachedSubmitted: true, cachedTotal: true }
          })
        );
    }

    const total = await db.participant.count({
      where: {
        isMapped: true
      }
    });

    const submitted = await db.participant.count({
      where: {
        isMapped: true,
        phase1Score: {
          gte: 0
        },
        session: {
          is: {
            hasSubmitted: true
          }
        }
      }
    });

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

        // Submitted-only leaderboard rule: qualification candidates must be fully submitted and scored.
        // Robustness requirement: qualify top N independently per track/year.
        const [rankedFirstYearParticipants, rankedSecondYearParticipants] = await Promise.all([
          tx.participant.findMany({
            where: {
              isMapped: true,
              track: "1st_year",
              phase1Score: {
                gte: 0
              },
              session: {
                is: {
                  hasSubmitted: true
                }
              }
            },
            orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
            select: {
              id: true
            }
          }),
          tx.participant.findMany({
            where: {
              isMapped: true,
              track: "2nd_year",
              phase1Score: {
                gte: 0
              },
              session: {
                is: {
                  hasSubmitted: true
                }
              }
            },
            orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }],
            select: {
              id: true
            }
          })
        ]);

        const qualifiedIds = [
          ...rankedFirstYearParticipants.slice(0, TOP_QUALIFIED_COUNT),
          ...rankedSecondYearParticipants.slice(0, TOP_QUALIFIED_COUNT)
        ].map((participant) => participant.id);

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
            phase1EndedAt: new Date(),
            cachedSubmitted: submitted,
            cachedTotal: total
          },
          create: {
            id: 1,
            phase1Active: false,
            leaderboardVisible: true,
            phase1EndedAt: new Date(),
            cachedSubmitted: submitted,
            cachedTotal: total
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
