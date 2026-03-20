import { db } from "@/lib/db";
import { getQuestionsByYear } from "@/lib/questions";
import { parseQuestionOptions } from "@/types/question";

interface QuestionPayload {
  questionId: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

const createSeededRng = (seedInput: string): (() => number) => {
  let hash = 2166136261;

  for (let index = 0; index < seedInput.length; index += 1) {
    hash ^= seedInput.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const deterministicShuffle = (input: string[], seed: string): string[] => {
  const copy = [...input];
  const rng = createSeededRng(seed);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(rng() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[randomIndex];
    copy[randomIndex] = temp;
  }

  return copy;
};

const normalizeUsn = (usn: string): string => usn.trim().toUpperCase();

const parseShuffledIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry));
};

export const ensureParticipantSession = async (inputUsn: string, inputYear?: string) => {
  const usn = normalizeUsn(inputUsn);
  const existing = await db.participantSession.findUnique({ where: { usn } });
  if (existing) {
    return existing;
  }

  const participant = await db.participant.findUnique({
    where: { usn },
    select: { year: true }
  });
  const participantYear = inputYear ?? participant?.year ?? "2nd";

  const questions = await getQuestionsByYear(participantYear);
  const orderedIds = questions.map((question) => String(question.id));
  const shuffledQuestionIds = deterministicShuffle(orderedIds, `phase1:${usn}`);

  return db.participantSession.upsert({
    where: { usn },
    update: {},
    create: {
      usn,
      shuffledQuestionIds,
      confirmedAnswers: {},
      currentQuestionIndex: 0,
      hasSubmitted: false
    }
  });
};

export const preloadMappedParticipantSessions = async (): Promise<void> => {
  const mappedParticipants = await db.participant.findMany({
    where: {
      isMapped: true,
      mappedTo: {
        not: null
      },
      NOT: {
        mappedTo: "WAITING_FOR_OPPONENT"
      }
    },
    select: {
      usn: true,
      year: true
    }
  });

  await Promise.allSettled(
    mappedParticipants.map((participant) => ensureParticipantSession(participant.usn, participant.year))
  );
};

export const getQuestionsForParticipant = async (inputUsn: string, participantYear?: string): Promise<QuestionPayload[]> => {
  const session = await ensureParticipantSession(inputUsn, participantYear);
  const shuffledIds = parseShuffledIds(session.shuffledQuestionIds);

  const questions = await db.question.findMany({
    where: {
      id: {
        in: shuffledIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      }
    }
  });

  const byId = new Map<number, (typeof questions)[number]>();
  questions.forEach((question) => {
    byId.set(question.id, question);
  });

  return shuffledIds
    .map((questionId) => {
      const question = byId.get(Number(questionId));
      if (!question) {
        return null;
      }

      return {
        questionId,
        text: question.questionText,
        options: parseQuestionOptions(question.options).map((option) => ({
          id: option.optionId,
          text: option.optionText
        }))
      };
    })
    .filter((entry): entry is QuestionPayload => entry !== null);
};

export const getConfirmedAnswersMap = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, string> = {};

  entries.forEach(([questionId, selectedOptionId]) => {
    if (typeof selectedOptionId === "string") {
      result[String(questionId)] = selectedOptionId;
    }
  });

  return result;
};

export const isSessionFullySubmitted = async (inputUsn: string): Promise<boolean> => {
  // Submitted-only leaderboard rule helper: rely on session.hasSubmitted in DB, not client-side progress.
  const usn = normalizeUsn(inputUsn);
  const session = await db.participantSession.findUnique({
    where: { usn },
    select: { hasSubmitted: true }
  });

  return session?.hasSubmitted === true;
};

export const getSessionSubmissionStats = async (
  inputUsn: string
): Promise<{ hasSubmitted: boolean; phase1Score: number | null; submittedAt: Date | null }> => {
  // Submitted-only leaderboard rule helper: expose durable submit+score state for idempotency and verification.
  const usn = normalizeUsn(inputUsn);
  const session = await db.participantSession.findUnique({
    where: { usn },
    select: {
      hasSubmitted: true,
      submittedAt: true,
      participant: {
        select: {
          phase1Score: true
        }
      }
    }
  });

  if (!session) {
    return {
      hasSubmitted: false,
      phase1Score: null,
      submittedAt: null
    };
  }

  return {
    hasSubmitted: session.hasSubmitted,
    phase1Score: session.participant?.phase1Score ?? null,
    submittedAt: session.submittedAt
  };
};
