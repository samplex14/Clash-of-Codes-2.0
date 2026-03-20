import { prisma } from "../lib/db";

type SeedQuestion = {
  year: "2nd";
  questionText: string;
  options: { optionId: string; optionText: string }[];
  correctOptionId: string;
  matchRound?: number;
};

export async function seedSecondYearQuestions(): Promise<void> {
  const secondYearQuestions: SeedQuestion[] = [
    {
      year: "2nd",
      questionText: "What is the time complexity of binary search on a sorted array?",
      options: [
        { optionId: "0", optionText: "O(n)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n log n)" },
        { optionId: "3", optionText: "O(1)" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: "Which data structure follows the LIFO principle?",
      options: [
        { optionId: "0", optionText: "Queue" },
        { optionId: "1", optionText: "Stack" },
        { optionId: "2", optionText: "Heap" },
        { optionId: "3", optionText: "Graph" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: "In JavaScript, which keyword declares a block-scoped variable?",
      options: [
        { optionId: "0", optionText: "var" },
        { optionId: "1", optionText: "const" },
        { optionId: "2", optionText: "define" },
        { optionId: "3", optionText: "static" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: "Which SQL clause is used to filter rows after aggregation?",
      options: [
        { optionId: "0", optionText: "WHERE" },
        { optionId: "1", optionText: "GROUP BY" },
        { optionId: "2", optionText: "HAVING" },
        { optionId: "3", optionText: "ORDER BY" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: "What does REST stand for?",
      options: [
        { optionId: "0", optionText: "Rapid Execution State Transfer" },
        { optionId: "1", optionText: "Representational State Transfer" },
        { optionId: "2", optionText: "Resource Encoding Syntax Tree" },
        { optionId: "3", optionText: "Rendered Endpoint Service Type" }
      ],
      correctOptionId: "1",
      matchRound: 1
    }
  ];

  await prisma.question.createMany({
    data: secondYearQuestions,
    skipDuplicates: true
  });

  console.log(`Seeded ${secondYearQuestions.length} second year questions`);
}
