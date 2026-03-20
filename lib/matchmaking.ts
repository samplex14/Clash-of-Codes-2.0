import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT";

export interface PublicParticipantInfo {
  usn: string;
  name: string;
}

export interface GhostOpponentInfo {
  usn: string;
  name: string;
}

export type MatchmakingResult =
  | {
      status: "matched";
      participant: PublicParticipantInfo;
      opponent: PublicParticipantInfo;
      matchedAt: Date;
    }
  | {
      status: "waiting";
      participant: PublicParticipantInfo;
      queueMessage: string;
    }
  | {
      status: "retry";
      message: string;
    };

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

const toPublic = (participant: { usn: string; name: string }): PublicParticipantInfo => ({
  usn: participant.usn,
  name: participant.name
});

interface MatchParticipantRow {
  usn: string;
  name: string;
  year: string;
  isMapped: boolean;
  mappedTo: string | null;
  mappedAt: Date | null;
}

interface MatchCandidateRow {
  usn: string;
  name: string;
  year: string;
  isMapped: boolean;
  mappedTo: string | null;
}

export const matchmakingLocks = new Set<string>();

export const assignMatchForParticipant = async (inputUsn: string, inputYear: string): Promise<MatchmakingResult> => {
  const usn = normalizeUsn(inputUsn);
  if (!usn) {
    return {
      status: "retry",
      message: "USN is required"
    };
  }

  if (matchmakingLocks.has(usn)) {
    return {
      status: "retry",
      message: "Matchmaking is already running for this participant"
    };
  }

  const lockedUsns = new Set<string>([usn]);
  matchmakingLocks.add(usn);

  try {
    const result = await db.$transaction(
      async (tx) => {
        const [participant] = await tx.$queryRaw<MatchParticipantRow[]>`
          SELECT "usn", "name", "year", "isMapped", "mappedTo", "mappedAt"
          FROM "Participant"
          WHERE "usn" = ${usn}
          LIMIT 1
        `;

        if (!participant) {
          return {
            status: "retry",
            message: "Participant not found"
          } satisfies MatchmakingResult;
        }

        const matchmakingYear = participant.year || inputYear;

        if (participant.isMapped && participant.mappedTo && participant.mappedTo !== WAITING_FOR_OPPONENT) {
          const [mappedOpponent] = await tx.$queryRaw<Array<{ usn: string; name: string }>>`
            SELECT "usn", "name"
            FROM "Participant"
            WHERE "usn" = ${participant.mappedTo}
            LIMIT 1
          `;

          if (!mappedOpponent) {
            return {
              status: "retry",
              message: "Mapped opponent record is missing"
            } satisfies MatchmakingResult;
          }

          return {
            status: "matched",
            participant: toPublic(participant),
            opponent: toPublic(mappedOpponent),
            matchedAt: participant.mappedAt ?? new Date()
          } satisfies MatchmakingResult;
        }

        if (participant.isMapped && participant.mappedTo === WAITING_FOR_OPPONENT) {
          return {
            status: "waiting",
            participant: toPublic(participant),
            queueMessage: "No rival available yet. Holding your battle slot in queue."
          } satisfies MatchmakingResult;
        }

        const candidates = await tx.$queryRaw<MatchCandidateRow[]>`
          SELECT "usn", "name", "year", "isMapped", "mappedTo"
          FROM "Participant"
          WHERE (
              "isMapped" = false
              OR ("isMapped" = true AND "mappedTo" = ${WAITING_FOR_OPPONENT})
            )
            AND "usn" <> ${usn}
            AND "year" = ${matchmakingYear}
        `;

        if (candidates.length === 0) {
          await tx.$executeRaw`
            UPDATE "Participant"
            SET "isMapped" = true,
                "mappedTo" = ${WAITING_FOR_OPPONENT},
                "mappedAt" = NOW(),
                "updatedAt" = NOW()
            WHERE "usn" = ${usn}
          `;

          return {
            status: "waiting",
            participant: toPublic(participant),
            queueMessage: "No rival available yet. Holding your battle slot in queue."
          } satisfies MatchmakingResult;
        }

        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedOpponent = candidates[randomIndex];

        if (matchmakingLocks.has(selectedOpponent.usn)) {
          return {
            status: "retry",
            message: "Opponent slot is busy. Retry matchmaking."
          } satisfies MatchmakingResult;
        }

        matchmakingLocks.add(selectedOpponent.usn);
        lockedUsns.add(selectedOpponent.usn);

        const matchedAt = new Date();

        await tx.$executeRaw`
          UPDATE "Participant"
          SET "isMapped" = true,
              "mappedTo" = ${selectedOpponent.usn},
              "mappedAt" = ${matchedAt},
              "updatedAt" = NOW()
          WHERE "usn" = ${usn}
        `;

        await tx.$executeRaw`
          UPDATE "Participant"
          SET "isMapped" = true,
              "mappedTo" = ${usn},
              "mappedAt" = ${matchedAt},
              "updatedAt" = NOW()
          WHERE "usn" = ${selectedOpponent.usn}
        `;

        return {
          status: "matched",
          participant: toPublic(participant),
          opponent: toPublic(selectedOpponent),
          matchedAt
        } satisfies MatchmakingResult;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return result;
  } catch (error: unknown) {
    const isSerializationError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2034";

    if (isSerializationError) {
      return {
        status: "retry",
        message: "Matchmaking conflict detected. Retry your battle search."
      };
    }

    throw error;
  } finally {
    lockedUsns.forEach((lockedUsn) => {
      matchmakingLocks.delete(lockedUsn);
    });
  }
};

export const findOpponentForQueuedParticipant = async (inputUsn: string, inputYear: string): Promise<MatchmakingResult> => {
  const usn = normalizeUsn(inputUsn);
  if (!usn) {
    return {
      status: "retry",
      message: "USN is required"
    };
  }

  if (matchmakingLocks.has(usn)) {
    return {
      status: "retry",
      message: "Matchmaking queue is busy. Retry scouting."
    };
  }

  const lockedUsns = new Set<string>([usn]);
  matchmakingLocks.add(usn);

  try {
    const result = await db.$transaction(
      async (tx) => {
        const [participant] = await tx.$queryRaw<MatchParticipantRow[]>`
          SELECT "usn", "name", "year", "isMapped", "mappedTo", "mappedAt"
          FROM "Participant"
          WHERE "usn" = ${usn}
          LIMIT 1
        `;

        if (!participant) {
          return {
            status: "retry",
            message: "Participant not found"
          } satisfies MatchmakingResult;
        }

        const matchmakingYear = participant.year || inputYear;

        if (participant.isMapped && participant.mappedTo && participant.mappedTo !== WAITING_FOR_OPPONENT) {
          const [mappedOpponent] = await tx.$queryRaw<Array<{ usn: string; name: string }>>`
            SELECT "usn", "name"
            FROM "Participant"
            WHERE "usn" = ${participant.mappedTo}
            LIMIT 1
          `;

          if (!mappedOpponent) {
            return {
              status: "retry",
              message: "Mapped opponent record is missing"
            } satisfies MatchmakingResult;
          }

          return {
            status: "matched",
            participant: toPublic(participant),
            opponent: toPublic(mappedOpponent),
            matchedAt: participant.mappedAt ?? new Date()
          } satisfies MatchmakingResult;
        }

        if (!participant.isMapped || participant.mappedTo !== WAITING_FOR_OPPONENT) {
          return {
            status: "waiting",
            participant: toPublic(participant),
            queueMessage: "Hold your position. A rival has not entered queue yet."
          } satisfies MatchmakingResult;
        }

        const candidates = await tx.$queryRaw<MatchCandidateRow[]>`
          SELECT "usn", "name", "year", "isMapped", "mappedTo"
          FROM "Participant"
          WHERE (
              "isMapped" = false
              OR ("isMapped" = true AND "mappedTo" = ${WAITING_FOR_OPPONENT})
            )
            AND "usn" <> ${usn}
            AND "year" = ${matchmakingYear}
        `;

        if (candidates.length === 0) {
          return {
            status: "waiting",
            participant: toPublic(participant),
            queueMessage: "Hold your position. A rival has not entered queue yet."
          } satisfies MatchmakingResult;
        }

        const selectedOpponent = candidates[Math.floor(Math.random() * candidates.length)];

        if (matchmakingLocks.has(selectedOpponent.usn)) {
          return {
            status: "retry",
            message: "Opponent slot is busy. Retry matchmaking."
          } satisfies MatchmakingResult;
        }

        matchmakingLocks.add(selectedOpponent.usn);
        lockedUsns.add(selectedOpponent.usn);

        const matchedAt = new Date();

        await tx.$executeRaw`
          UPDATE "Participant"
          SET "mappedTo" = ${selectedOpponent.usn},
              "mappedAt" = ${matchedAt},
              "updatedAt" = NOW()
          WHERE "usn" = ${usn}
        `;

        await tx.$executeRaw`
          UPDATE "Participant"
          SET "isMapped" = true,
              "mappedTo" = ${usn},
              "mappedAt" = ${matchedAt},
              "updatedAt" = NOW()
          WHERE "usn" = ${selectedOpponent.usn}
        `;

        return {
          status: "matched",
          participant: toPublic(participant),
          opponent: toPublic(selectedOpponent),
          matchedAt
        } satisfies MatchmakingResult;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return result;
  } catch (error: unknown) {
    const isSerializationError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2034";

    if (isSerializationError) {
      return {
        status: "retry",
        message: "Matchmaking conflict detected. Retry your battle search."
      };
    }

    throw error;
  } finally {
    lockedUsns.forEach((lockedUsn) => {
      matchmakingLocks.delete(lockedUsn);
    });
  }
};

export const buildGhostOpponent = (): GhostOpponentInfo => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  return {
    name: `WARRIOR_BOT_${code}`,
    usn: `BOT_${code}`
  };
};
