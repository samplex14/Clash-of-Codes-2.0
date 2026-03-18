import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

type SeedQuestion = {
  questionText: string;
  options: { optionId: string; optionText: string }[];
  correctOptionId: string;
  matchRound?: number;
};

const sampleQuestions: SeedQuestion[] = [
  {
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
    questionText: "What does REST stand for?",
    options: [
      { optionId: "0", optionText: "Rapid Execution State Transfer" },
      { optionId: "1", optionText: "Representational State Transfer" },
      { optionId: "2", optionText: "Resource Encoding Syntax Tree" },
      { optionId: "3", optionText: "Rendered Endpoint Service Type" }
    ],
    correctOptionId: "1",
    matchRound: 1
  },
  {
    questionText: "Which HTTP status code means 'Not Found'?",
    options: [
      { optionId: "0", optionText: "200" },
      { optionId: "1", optionText: "301" },
      { optionId: "2", optionText: "404" },
      { optionId: "3", optionText: "500" }
    ],
    correctOptionId: "2",
    matchRound: 1
  },
  {
    questionText: "What is the output type of JSON.parse in JavaScript?",
    options: [
      { optionId: "0", optionText: "String" },
      { optionId: "1", optionText: "Number" },
      { optionId: "2", optionText: "JavaScript object/value" },
      { optionId: "3", optionText: "Function" }
    ],
    correctOptionId: "2",
    matchRound: 1
  },
  {
    questionText: "Which sorting algorithm is generally fastest on average for large random arrays?",
    options: [
      { optionId: "0", optionText: "Bubble Sort" },
      { optionId: "1", optionText: "Selection Sort" },
      { optionId: "2", optionText: "Quick Sort" },
      { optionId: "3", optionText: "Insertion Sort" }
    ],
    correctOptionId: "2",
    matchRound: 1
  },
  {
    questionText: "Which Git command creates a new branch and switches to it?",
    options: [
      { optionId: "0", optionText: "git branch -m" },
      { optionId: "1", optionText: "git checkout -b" },
      { optionId: "2", optionText: "git merge --new" },
      { optionId: "3", optionText: "git switch --detach" }
    ],
    correctOptionId: "1",
    matchRound: 1
  },
  {
    questionText: "In TypeScript, which type represents any non-primitive key-value object?",
    options: [
      { optionId: "0", optionText: "unknown" },
      { optionId: "1", optionText: "object" },
      { optionId: "2", optionText: "never" },
      { optionId: "3", optionText: "void" }
    ],
    correctOptionId: "1",
    matchRound: 1
  }
];

async function main(): Promise<void> {
  const deleted = await prisma.question.deleteMany();

  await prisma.question.createMany({
    data: sampleQuestions.map((question) => ({
      questionText: question.questionText,
      options: question.options,
      correctOptionId: question.correctOptionId,
      matchRound: question.matchRound ?? null
    }))
  });

  console.log(`Seeded ${sampleQuestions.length} questions (cleared ${deleted.count} existing records).`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed questions:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
