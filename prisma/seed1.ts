import { prisma } from "../lib/db";

type SeedQuestion = {
  year: "1st";
  questionText: string;
  options: { optionId: string; optionText: string }[];
  correctOptionId: string;
  matchRound?: number;
};

export async function seedFirstYearQuestions(): Promise<void> {
  const firstYearQuestions: SeedQuestion[] = [
    {
      year: "1st",
      questionText: "In C, which symbol ends a statement?",
      options: [
        { optionId: "0", optionText: ":" },
        { optionId: "1", optionText: ";" },
        { optionId: "2", optionText: "." },
        { optionId: "3", optionText: "," }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: "Which C data type is used to store whole numbers?",
      options: [
        { optionId: "0", optionText: "int" },
        { optionId: "1", optionText: "float" },
        { optionId: "2", optionText: "char*" },
        { optionId: "3", optionText: "double" }
      ],
      correctOptionId: "0",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: "What is the index of the first element in an array in C?",
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "-1" },
        { optionId: "2", optionText: "0" },
        { optionId: "3", optionText: "Depends on compiler" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: "What is the time complexity of linear search in an unsorted array?",
      options: [
        { optionId: "0", optionText: "O(1)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n)" },
        { optionId: "3", optionText: "O(n log n)" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: "Which HTML tag is used for the largest heading?",
      options: [
        { optionId: "0", optionText: "<heading>" },
        { optionId: "1", optionText: "<h6>" },
        { optionId: "2", optionText: "<h1>" },
        { optionId: "3", optionText: "<head>" }
      ],
      correctOptionId: "2",
      matchRound: 1
    }
  ];

  await prisma.question.createMany({
    data: firstYearQuestions,
    skipDuplicates: true
  });

  console.log(`Seeded ${firstYearQuestions.length} first year questions`);
}
