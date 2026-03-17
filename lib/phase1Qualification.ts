import { db } from "./db";

export const TOP_QUALIFIED_COUNT = 64;

export interface RankedParticipant {
  id: number;
  usn: string;
  name: string;
  phase1Score: number;
  qualified: boolean;
  rank: number;
}

export const computePhase1Qualification = async (): Promise<{
  qualifiedCount: number;
  submittedCount: number;
  ranked: RankedParticipant[];
}> => {
  const submitted = await db.participant.findMany({
    where: {
      submittedAt: {
        not: null
      }
    },
    orderBy: [
      { phase1Score: "desc" },
      { submittedAt: "asc" },
      { id: "asc" }
    ]
  });

  await db.participant.updateMany({
    data: {
      qualified: false
    }
  });

  const qualified = submitted.slice(0, TOP_QUALIFIED_COUNT);
  const qualifiedIds = qualified.map((participant) => participant.id);

  if (qualifiedIds.length > 0) {
    await db.participant.updateMany({
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

  const ranked = submitted.map((participant, index) => ({
    id: participant.id,
    usn: participant.usn,
    name: participant.name,
    phase1Score: participant.phase1Score,
    qualified: qualifiedIds.includes(participant.id),
    rank: index + 1
  }));

  return {
    qualifiedCount: qualified.length,
    submittedCount: submitted.length,
    ranked
  };
};
