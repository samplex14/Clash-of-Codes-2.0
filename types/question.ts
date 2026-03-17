import type { Question as PrismaQuestion, Prisma } from "@prisma/client";

export interface Option {
  optionId: string;
  optionText: string;
}

export interface Question extends Omit<PrismaQuestion, "options"> {
  options: Option[];
}

export interface QuestionWithoutAnswer {
  id: number;
  questionText: string;
  options: Option[];
  matchRound: number | null;
  createdAt: Date;
}

export const parseQuestionOptions = (value: Prisma.JsonValue): Option[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry: Prisma.JsonValue): Option | null => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const optionId = "optionId" in entry ? (entry.optionId as unknown) : null;
      const optionText = "optionText" in entry ? (entry.optionText as unknown) : null;

      if (typeof optionId !== "string" || typeof optionText !== "string") {
        return null;
      }

      return { optionId, optionText };
    })
    .filter((entry: Option | null): entry is Option => entry !== null);
};
