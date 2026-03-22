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
      questionText: `What is the output of the following C code?

int f(int n) {
  if (n <= 1) return 1;
  return f(n - 1) + f(n - 2) + f(n - 3);
}

printf("%d", f(5));`,
      options: [
        { optionId: "0", optionText: "13" },
        { optionId: "1", optionText: "17" },
        { optionId: "2", optionText: "19" },
        { optionId: "3", optionText: "21" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int a[] = {1, 3, 5, 7};
int *p = a;
int **q = &p;

printf("%d", *(q + *(p + 1) / 2));`,
      options: [
        { optionId: "0", optionText: "3" },
        { optionId: "1", optionText: "5" },
        { optionId: "2", optionText: "7" },
        { optionId: "3", optionText: "Garbage" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `What is the time complexity of the following code?

for (int i = 1; i < n; i *= 2) {
  for (int j = 1; j < n; j += i) {
    for (int k = 0; k < j; k++) {
      // body
    }
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n log n)" },
        { optionId: "1", optionText: "O(n^2)" },
        { optionId: "2", optionText: "O(n^2 log n)" },
        { optionId: "3", optionText: "O(n log^2 n)" }
      ],
      correctOptionId: "2",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

char s[] = "abcdef";
printf("%c", *(s + ((s[2] - s[1]) - 1)));`,
      options: [
        { optionId: "0", optionText: "a" },
        { optionId: "1", optionText: "b" },
        { optionId: "2", optionText: "c" },
        { optionId: "3", optionText: "d" }
      ],
      correctOptionId: "0",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int f(int n) {
  if (n == 0) return 0;
  if (n % 2 == 0) return f(n / 2);
  return 1 + f(n - 1);
}

printf("%d", f(15));`,
      options: [
        { optionId: "0", optionText: "4" },
        { optionId: "1", optionText: "5" },
        { optionId: "2", optionText: "6" },
        { optionId: "3", optionText: "7" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `What is the most accurate outcome of this function?

struct node {
  int data;
  struct node* next;
};

int countNodes(struct node* head) {
  int c = 0;
  while (head) {
    c++;
    head = head->next->next;
  }
  return c;
}`,
      options: [
        { optionId: "0", optionText: "Total nodes" },
        { optionId: "1", optionText: "Half nodes" },
        { optionId: "2", optionText: "Nodes at even positions" },
        { optionId: "3", optionText: "Undefined behavior" }
      ],
      correctOptionId: "3",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `What is the output of the following JavaScript code?

console.log([] + {} + [] + {});`,
      options: [
        { optionId: "0", optionText: "[object Object][object Object]" },
        { optionId: "1", optionText: "[object Object]" },
        { optionId: "2", optionText: "[object Object][object Object][object Object]" },
        { optionId: "3", optionText: "Error" }
      ],
      correctOptionId: "0",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int a[] = {2, 4, 6, 8};
int *p = a;

printf("%d", *(p + ((*(p + 2) - *(p + 1)) / 2)));`,
      options: [
        { optionId: "0", optionText: "4" },
        { optionId: "1", optionText: "6" },
        { optionId: "2", optionText: "8" },
        { optionId: "3", optionText: "Garbage" }
      ],
      correctOptionId: "2",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int f(int n) {
  if (n <= 1) return 1;
  return n * f(n - 1) + f(n - 2);
}

printf("%d", f(4));`,
      options: [
        { optionId: "0", optionText: "43" },
        { optionId: "1", optionText: "45" },
        { optionId: "2", optionText: "48" },
        { optionId: "3", optionText: "50" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `What is the time complexity of the following code?

for (int i = 1; i <= n; i++) {
  for (int j = 1; j <= n; j *= 2) {
    for (int k = 1; k <= j; k++) {
      for (int l = 1; l <= i; l++) {
        // body
      }
    }
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n^2 log n)" },
        { optionId: "1", optionText: "O(n^3 log n)" },
        { optionId: "2", optionText: "O(n^2 log^2 n)" },
        { optionId: "3", optionText: "O(n log n)" }
      ],
      correctOptionId: "0",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `What is the output of the following JavaScript code?

console.log(!![] + !![] * !![]);`,
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "2" },
        { optionId: "2", optionText: "3" },
        { optionId: "3", optionText: "4" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int x = 18;
while (x) {
  x = x & (x - 1);
}
printf("%d", x);`,
      options: [
        { optionId: "0", optionText: "0" },
        { optionId: "1", optionText: "1" },
        { optionId: "2", optionText: "2" },
        { optionId: "3", optionText: "Infinite loop" }
      ],
      correctOptionId: "0",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

int a[] = {1, 2, 3, 4, 5};
int *p = a;
int sum = 0;

for (int i = 0; i < 5; i++) {
  sum += *(p + (i % 3));
}

printf("%d", sum);`,
      options: [
        { optionId: "0", optionText: "9" },
        { optionId: "1", optionText: "10" },
        { optionId: "2", optionText: "11" },
        { optionId: "3", optionText: "12" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `What is the time complexity of the following recursion?

int f(int n) {
  if (n == 1) return 1;
  return f(n / 2) + f(n / 2);
}`,
      options: [
        { optionId: "0", optionText: "O(n)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n log n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "0",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `What is the output of the following JavaScript code?

console.log([] == ![]);`,
      options: [
        { optionId: "0", optionText: "true" },
        { optionId: "1", optionText: "false" },
        { optionId: "2", optionText: "error" },
        { optionId: "3", optionText: "undefined" }
      ],
      correctOptionId: "0",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: "If we delete a node given only a pointer to that node (not head), what is the correct approach?",
      options: [
        { optionId: "0", optionText: "Not possible" },
        { optionId: "1", optionText: "Copy next node data and delete next" },
        { optionId: "2", optionText: "Delete current node directly" },
        { optionId: "3", optionText: "O(n)" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: "Which of the following correctly swaps two integers a and b without extra space for all valid cases (including same memory)?",
      options: [
        { optionId: "0", optionText: "a = a ^ b; b = a ^ b; a = a ^ b;" },
        { optionId: "1", optionText: "a = a ^ b; b = b ^ a; a = a ^ b;" },
        { optionId: "2", optionText: "a = a ^ b; b = a ^ b; a = b ^ a;" },
        { optionId: "3", optionText: "a = a ^ b; b = a ^ b; b = a ^ b;" }
      ],
      correctOptionId: "1",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `What is the output of the following C code?

char s[] = "xyz";
printf("%c", *(s + (s[0] - s[2])));`,
      options: [
        { optionId: "0", optionText: "x" },
        { optionId: "1", optionText: "y" },
        { optionId: "2", optionText: "z" },
        { optionId: "3", optionText: "Garbage" }
      ],
      correctOptionId: "3",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `What is the output of the following JavaScript code?

let a = {};
let b = { key: "value" };
let c = { key: "value" };

a[b] = 1;
a[c] = 2;

console.log(a[b]);`,
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "2" },
        { optionId: "2", optionText: "undefined" },
        { optionId: "3", optionText: "error" }
      ],
      correctOptionId: "1",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `What is the time complexity of the following recursion?

int f(int n) {
  if (n <= 1) return 1;
  return f(n - 1) + f(n / 2);
}`,
      options: [
        { optionId: "0", optionText: "O(n)" },
        { optionId: "1", optionText: "O(n log n)" },
        { optionId: "2", optionText: "O(2^n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "2",
      matchRound: 4
    }
  ];

  await prisma.question.createMany({
    data: secondYearQuestions,
    skipDuplicates: true
  });

  console.log(`Seeded ${secondYearQuestions.length} second year questions`);
}
