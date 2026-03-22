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
      questionText: `What is the output of the following C code?

int i = 1;
    i = i++ + ++i + i++;
    printf("%d", i);`,
      options: [
        { optionId: "0", optionText: "6" },
        { optionId: "1", optionText: "7" },
        { optionId: "2", optionText: "8" },
        { optionId: "3", optionText: "Undefined Behavior" }
      ],
      correctOptionId: "3",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int x = 10;
    printf("%d", x & (x - 1));`,
      options: [
        { optionId: "0", optionText: "8" },
        { optionId: "1", optionText: "9" },
        { optionId: "2", optionText: "10" },
        { optionId: "3", optionText: "2" }
      ],
      correctOptionId: "0",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int a[5] = {10, 20, 30, 40, 50};
    int *p = a;
    printf("%d", *(p + 3));`,
      options: [
        { optionId: "0", optionText: "30" },
        { optionId: "1", optionText: "40" },
        { optionId: "2", optionText: "50" },
        { optionId: "3", optionText: "20" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int a[2][3] = {1, 2, 3, 4, 5, 6};
    printf("%d", *(*(a + 1) + 2));`,
      options: [
        { optionId: "0", optionText: "5" },
        { optionId: "1", optionText: "6" },
        { optionId: "2", optionText: "4" },
        { optionId: "3", optionText: "3" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int f(int n) {
  if (n <= 1) return 1;
  return f(n - 1) + f(n - 2);
}

printf("%d", f(5));`,
      options: [
        { optionId: "0", optionText: "5" },
        { optionId: "1", optionText: "8" },
        { optionId: "2", optionText: "13" },
        { optionId: "3", optionText: "3" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

    int x = 7;
int count = 0;

while (x) {
  x = x & (x - 1);
  count++;
}

printf("%d", count);`,
      options: [
        { optionId: "0", optionText: "2" },
        { optionId: "1", optionText: "3" },
        { optionId: "2", optionText: "1" },
        { optionId: "3", optionText: "7" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int a[] = {1, 2, 3, 4};
    int *p = a;

    p++;
    *p = 10;

    printf("%d", a[1]);`,
      options: [
        { optionId: "0", optionText: "2" },
        { optionId: "1", optionText: "10" },
        { optionId: "2", optionText: "3" },
        { optionId: "3", optionText: "Error" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

    int count = 0;

for (int i = 1; i < 8; i *= 2) {
  for (int j = 0; j < i; j++) {
    count++;
  }
}

printf("%d", count);`,
      options: [
        { optionId: "0", optionText: "7" },
        { optionId: "1", optionText: "8" },
        { optionId: "2", optionText: "15" },
        { optionId: "3", optionText: "14" }
      ],
      correctOptionId: "0",
      matchRound: 2
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

int arr[10];
    int *p = arr;

    printf("%zu", sizeof(p));`,
      options: [
        { optionId: "0", optionText: "40" },
        { optionId: "1", optionText: "10" },
        { optionId: "2", optionText: "8" },
        { optionId: "3", optionText: "Error" }
      ],
      correctOptionId: "2",
      matchRound: 2
    },
    {
      year: "1st",
      questionText: `What is the output of the following C code?

    #include<stdio.h>

    int main(){
    int x = 1;
    int y = x++ + ++x + x++ + ++x;
    printf("%d %d", x, y);
    }`,
      options: [
        { optionId: "0", optionText: "5 14" },
        { optionId: "1", optionText: "5 13" },
        { optionId: "2", optionText: "5 12" },
        { optionId: "3", optionText: "Undefined" }
      ],
      correctOptionId: "3",
      matchRound: 2
    },
    {
      year: "1st",
      questionText: `What is the time complexity of the following code?

for (int i = 1; i < n; i *= 2) {
  for (int j = 0; j < i; j++) {
    // body
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n)" },
        { optionId: "1", optionText: "O(n log n)" },
        { optionId: "2", optionText: "O(log n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "0",
      matchRound: 3
    },
    {
      year: "1st",
      questionText: "What does x & (-x) return?",
      options: [
        { optionId: "0", optionText: "Highest set bit" },
        { optionId: "1", optionText: "Lowest set bit" },
        { optionId: "2", optionText: "Zero" },
        { optionId: "3", optionText: "Complement" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "1st",
      questionText: "Worst-case recursion space?",
      options: [
        { optionId: "0", optionText: "O(1)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "1st",
      questionText: "Address of arr[i][j]?",
      options: [
        { optionId: "0", optionText: "base + i + j" },
        { optionId: "1", optionText: "base + (i*n + j)" },
        { optionId: "2", optionText: "base + (i + j*n)" },
        { optionId: "3", optionText: "base + i*j" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "1st",
      questionText: "Binary search comparisons?",
      options: [
        { optionId: "0", optionText: "log2 n" },
        { optionId: "1", optionText: "log2 n + 1" },
        { optionId: "2", optionText: "n" },
        { optionId: "3", optionText: "n/2" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "1st",
      questionText: "Merge sort auxiliary space?",
      options: [
        { optionId: "0", optionText: "O(1)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "2",
      matchRound: 4
    },
    {
      year: "1st",
      questionText: "Minimum reversals to rotate array?",
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "2" },
        { optionId: "2", optionText: "3" },
        { optionId: "3", optionText: "k" }
      ],
      correctOptionId: "2",
      matchRound: 4
    },
    {
      year: "1st",
      questionText: `What is the time complexity of the following code?

for (i = 1; i < n; i *= 2) {
  for (j = 1; j < n; j *= 2) {
    for (k = 0; k < n; k++) {
      // body
    }
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n log n)" },
        { optionId: "1", optionText: "O(n (log n)^2)" },
        { optionId: "2", optionText: "O(n^2)" },
        { optionId: "3", optionText: "O(n^2 log n)" }
      ],
      correctOptionId: "1",
      matchRound: 4
    },
    {
      year: "1st",
      questionText: "Q: Which sequence will swap two numbers using XOR?",
      options: [
        {
          optionId: "0",
          optionText: `a = a ^ b;
b = a ^ b;
a = a ^ b;`
        },
        {
          optionId: "1",
          optionText: `a = a ^ b;
b = b ^ a;
a = a ^ b;`
        },
        {
          optionId: "2",
          optionText: `a = b ^ a;
b = a ^ b;
a = b ^ a;`
        },
        {
          optionId: "3",
          optionText: `b = a ^ b;
a = a ^ b;
b = a ^ b;`
        }
      ],
      correctOptionId: "0",
      matchRound: 4
    },
    {
      year: "1st",
      questionText: `What is the time complexity of the following code?

for (int i = 1; i <= n; i++) {
  for (int j = 1; j <= n; j *= 2) {
    for (int k = 1; k <= j; k++) {
      // body
    }
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n log n)" },
        { optionId: "1", optionText: "O(n^2)" },
        { optionId: "2", optionText: "O(n log^2 n)" },
        { optionId: "3", optionText: "O(n^2 log n)" }
      ],
      correctOptionId: "0",
      matchRound: 4
    }
  ];

  await prisma.question.createMany({
    data: firstYearQuestions,
    skipDuplicates: true
  });

  console.log(`Seeded ${firstYearQuestions.length} first year questions`);
}
