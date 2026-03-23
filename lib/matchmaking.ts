import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Matchmaking uses PostgreSQL row-level locking for database-safe concurrency.
 *
 * Why not in-memory locks:
 * - Serverless functions run in isolated instances with separate memory.
 * - A Set lock in one instance is invisible to another instance.
 *
 * How it works:
 * 1. SELECT FOR UPDATE locks the requester row exclusively.
 * 2. SELECT FOR UPDATE SKIP LOCKED picks an opponent that no other
 *    transaction is currently processing.
 * 3. Both rows are updated atomically in the same transaction.
 * 4. P2034 and PostgreSQL 40001 conflict retries handle serialization failures.
 * 5. Indexes on (year, isMapped, mappedTo) keep candidate scans fast.
 *
 * This guarantees:
 * - No participant is matched to two opponents simultaneously.
 * - No two requests can pick the same opponent.
 * - Partial matches cannot occur.
 * - Works correctly across all serverless instances hitting the same DB.
 */

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
  id: number;
  usn: string;
  name: string;
  year: string;
  isMapped: boolean;
  mappedTo: string | null;
  mappedAt: Date | null;
}

interface MatchCandidateRow {
  id: number;
  usn: string;
  name: string;
  year: string;
  isMapped: boolean;
  mappedTo: string | null;
}

interface ParticipantLookupRow {
  usn: string;
  name: string;
}

const MAX_RETRIES = 3;

const isMatchParticipantRow = (value: unknown): value is MatchParticipantRow => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "number" &&
    typeof row.usn === "string" &&
    typeof row.name === "string" &&
    typeof row.year === "string" &&
    typeof row.isMapped === "boolean" &&
    (typeof row.mappedTo === "string" || row.mappedTo === null)
  );
};

const isParticipantLookupRow = (value: unknown): value is ParticipantLookupRow => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;
  return typeof row.usn === "string" && typeof row.name === "string";
};

const isRetryableSerializationConflict = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") {
      return true;
    }

    if (error.code === "P2010") {
      const meta = error.meta as { code?: string; message?: string } | undefined;
      const sqlCode = String(meta?.code ?? "");
      const sqlMessage = String(meta?.message ?? "");
      return sqlCode === "40001" || sqlMessage.includes("could not serialize access due to concurrent update");
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const message = String(error.message ?? "");
    return message.includes("Code: `40001`") || message.includes("could not serialize access due to concurrent update");
  }

  if (typeof error === "object" && error !== null) {
    const maybe = error as { code?: unknown; message?: unknown; meta?: unknown };
    const rawCode = String(maybe.code ?? "");
    const rawMessage = String(maybe.message ?? "");
    const rawMeta = String(maybe.meta ?? "");
    if (rawCode === "40001") {
      return true;
    }

    if (
      rawMessage.includes("Code: `40001`") ||
      rawMessage.includes("could not serialize access due to concurrent update") ||
      rawMeta.includes("40001")
    ) {
      return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Code: `40001`") || message.includes("could not serialize access due to concurrent update");
};

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (isRetryableSerializationConflict(error) && attempt < MAX_RETRIES - 1) {
        attempt += 1;
        const jitter = Math.floor(Math.random() * 150) + 50;
        await new Promise((resolve) => {
          setTimeout(resolve, jitter);
        });
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

const runMatchmakingTransaction = async (usn: string, inputYear: string): Promise<MatchmakingResult> => {
  return db.$transaction(
    async (tx) => {
      const requesterRows = (await tx.$queryRaw`
        SELECT "id", "usn", "name", "year", "isMapped", "mappedTo", "mappedAt"
        FROM "Participant"
        WHERE "usn" = ${usn}
        FOR UPDATE
      `) as MatchParticipantRow[];

      const requester = requesterRows[0];
      if (!isMatchParticipantRow(requester)) {
        return {
          status: "retry",
          message: "Participant not found"
        };
      }

      const matchmakingYear = requester.year || inputYear;

      if (requester.isMapped && requester.mappedTo && requester.mappedTo !== WAITING_FOR_OPPONENT) {
        const opponentRows = (await tx.$queryRaw`
          SELECT "usn", "name"
          FROM "Participant"
          WHERE "usn" = ${requester.mappedTo}
          LIMIT 1
        `) as ParticipantLookupRow[];

        const mappedOpponent = opponentRows[0];
        if (!isParticipantLookupRow(mappedOpponent)) {
          return {
            status: "retry",
            message: "Mapped opponent record is missing"
          };
        }

        return {
          status: "matched",
          participant: toPublic(requester),
          opponent: toPublic(mappedOpponent),
          matchedAt: requester.mappedAt ?? new Date()
        };
      }

      const candidateRows = (await tx.$queryRaw`
        SELECT "id", "usn", "name", "year", "isMapped", "mappedTo", "mappedAt"
        FROM "Participant"
        WHERE "usn" <> ${usn}
          AND "year" = ${matchmakingYear}
          AND (
            ("isMapped" = false AND "mappedTo" IS NULL)
            OR ("isMapped" = true AND "mappedTo" = ${WAITING_FOR_OPPONENT})
          )
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `) as MatchCandidateRow[];

      const selectedOpponent = candidateRows[0];
      if (!selectedOpponent) {
        if (!(requester.isMapped && requester.mappedTo === WAITING_FOR_OPPONENT)) {
          await tx.$executeRaw`
            UPDATE "Participant"
            SET "isMapped" = true,
                "mappedTo" = ${WAITING_FOR_OPPONENT},
                "mappedAt" = NOW(),
                "updatedAt" = NOW()
            WHERE "usn" = ${usn}
          `;
        }

        return {
          status: "waiting",
          participant: toPublic(requester),
          queueMessage: "No rival available yet. Holding your battle slot in queue."
        };
      }

      if (!isMatchParticipantRow(selectedOpponent)) {
        return {
          status: "retry",
          message: "Invalid opponent record"
        };
      }

      if (selectedOpponent.usn === usn) {
        return {
          status: "retry",
          message: "Invalid opponent selection"
        };
      }

      // Deterministic lock order: requester is locked first, then opponent selection is locked with SKIP LOCKED.
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
        participant: toPublic(requester),
        opponent: toPublic(selectedOpponent),
        matchedAt
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000
    }
  );
};

export const assignMatchForParticipant = async (inputUsn: string, inputYear: string): Promise<MatchmakingResult> => {
  const usn = normalizeUsn(inputUsn);
  if (!usn) {
    return {
      status: "retry",
      message: "USN is required"
    };
  }

  try {

    return await withRetry(() => runMatchmakingTransaction(usn, inputYear));
  } catch (error: unknown) {
    if (isRetryableSerializationConflict(error)) {
      return {
        status: "retry",
        message: "Matchmaking conflict detected. Retry your battle search."
      };
    }

    throw error;
  }
};

export const findOpponentForQueuedParticipant = async (inputUsn: string, inputYear: string): Promise<MatchmakingResult> => {
  return assignMatchForParticipant(inputUsn, inputYear);
};

export const buildGhostOpponent = (): GhostOpponentInfo => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  return {
    name: `WARRIOR_BOT_${code}`,
    usn: `BOT_${code}`
  };
};
