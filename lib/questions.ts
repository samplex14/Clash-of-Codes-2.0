import type { Prisma } from "@prisma/client";
import type { Option } from "@/types/question";

export const parseIncomingOptions = (options: unknown): Option[] => {
  if (!Array.isArray(options)) {
    return [];
  }

  if (options.every((value: unknown): value is string => typeof value === "string")) {
    return options.map((optionText: string, index: number) => ({
      optionId: String(index),
      optionText
    }));
  }

  return options
    .map((value: unknown): Option | null => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
      }

      const optionId = "optionId" in value ? (value.optionId as unknown) : null;
      const optionText = "optionText" in value ? (value.optionText as unknown) : null;

      if (typeof optionId !== "string" || typeof optionText !== "string") {
        return null;
      }

      return { optionId, optionText };
    })
    .filter((value: Option | null): value is Option => value !== null);
};

export const toPrismaJson = (options: Option[]): Prisma.JsonArray => {
  return options.map((option) => ({
    optionId: option.optionId,
    optionText: option.optionText
  })) as Prisma.JsonArray;
};
