import { db } from "./db";
import type { Prisma } from "@prisma/client";

export const TOP_QUALIFIED_COUNT = 16;

type SubmittedParticipantCandidate = Prisma.ParticipantGetPayload<{
  include: {
    session: {
      select: {
        hasSubmitted: true;
        submittedAt: true;
      };
    };
  };
}>;

export type SubmittedParticipant = SubmittedParticipantCandidate & {
  phase1Score: number;
  session: {
    hasSubmitted: true;
    submittedAt: Date | null;
  };
};

export interface RankedParticipant {
  id: number;
  usn: string;
  name: string;
  phase1Score: number;
  qualified: boolean;
  rank: number;
}

const isSubmittedParticipantRecord = (value: SubmittedParticipantCandidate): value is SubmittedParticipant => {
  return value.session?.hasSubmitted === true && Number.isInteger(value.phase1Score);
};

export const getSubmittedParticipants = async (): Promise<SubmittedParticipant[]> => {
  // Submitted-only leaderboard rule: only mapped participants with hasSubmitted=true.
  // phase1Score is non-null by schema and additionally validated as an integer below.
  const participants = await db.participant.findMany({
    where: {
      isMapped: true,
      phase1Score: { gte: 0 },
      session: {
        is: {
          hasSubmitted: true
        }
      }
    },
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

  return participants.filter(isSubmittedParticipantRecord);
};

export const computePhase1Qualification = async (): Promise<{
  qualifiedCount: number;
  submittedCount: number;
  ranked: RankedParticipant[];
}> => {
  // Submitted-only leaderboard rule: ranking and qualification are computed from eligible submitted participants only.
  const submitted = await getSubmittedParticipants();

  await db.participant.updateMany({
    where: {
      isMapped: true
    },
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
