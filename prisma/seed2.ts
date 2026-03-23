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
      questionText: `Find the time complexity of the nested loops below.

Code snippet:

let count = 0;
for (let i = 0; i < n; i++) {
  for (let j = i; j < n; j += Math.max(1, Math.floor((j - i + 1) / 2))) {
    count++;
  }
}`,
      options: [
        { optionId: "0", optionText: "O(n)" },
        { optionId: "1", optionText: "O(n log n)" },
        { optionId: "2", optionText: "O(n^2)" },
        { optionId: "3", optionText: "O(n^2 log n)" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `Predict the output and understand Python's mutable default argument behavior.

Code snippet:

def func(arr=[]):
    arr.append(len(arr))
    return arr

print(func())
print(func())
print(func([10]))
print(func())`,
      options: [
        {
          optionId: "0",
          optionText: "[0] | [0] | [10, 1] | [0]"
        },
        {
          optionId: "1",
          optionText: "[0] | [0, 1] | [10, 1] | [0, 1, 2]"
        },
        {
          optionId: "2",
          optionText: "[0] | [0, 1] | [10, 1] | [0, 1, 2, 3]"
        },
        { optionId: "3", optionText: "Error" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `Find the time complexity of the recursive function f(n).

Code snippet:

function f(n) {
  if (n <= 1) return;
  for (let i = 0; i < n; i++) {}
  f(n - 1);
}`,
      options: [
        { optionId: "0", optionText: "O(log n)" },
        { optionId: "1", optionText: "O(n)" },
        { optionId: "2", optionText: "O(n log n)" },
        { optionId: "3", optionText: "O(n^2)" }
      ],
      correctOptionId: "3",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `A recursive function calls itself twice with n - 1 and does O(1) work each call. Find time and space complexity.`,
      options: [
        { optionId: "0", optionText: "Time: O(n), Space: O(log n)" },
        { optionId: "1", optionText: "Time: O(2^n), Space: O(n)" },
        { optionId: "2", optionText: "Time: O(n^2), Space: O(n)" },
        { optionId: "3", optionText: "Time: O(log n), Space: O(1)" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `In a rotated sorted array, you need to search for a target without explicitly finding pivot first. What is the minimum comparison complexity?`,
      options: [
        { optionId: "0", optionText: "O(1)" },
        { optionId: "1", optionText: "O(log n)" },
        { optionId: "2", optionText: "O(n)" },
        { optionId: "3", optionText: "O(n log n)" }
      ],
      correctOptionId: "1",
      matchRound: 1
    },
    {
      year: "2nd",
      questionText: `Find the LPS (Longest Prefix which is also Suffix) for the string "abacabab".`,
      options: [
        { optionId: "0", optionText: "a" },
        { optionId: "1", optionText: "ab" },
        { optionId: "2", optionText: "aba" },
        { optionId: "3", optionText: "abab" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `Identify the standard XOR operation sequence used to swap two numbers.

Code snippets:

A)
a = a ^ b;
b = a ^ b;
a = a ^ b;

B)
a = a ^ b;
b = b ^ a;
a = a ^ b;

C)
a = b ^ a;
b = a ^ b;
a = b ^ a;

D)
b = a ^ b;
a = a ^ b;
b = a ^ b;`,
      options: [
        { optionId: "0", optionText: "A" },
        { optionId: "1", optionText: "B" },
        { optionId: "2", optionText: "C" },
        { optionId: "3", optionText: "D" }
      ],
      correctOptionId: "0",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `Predict constructor/destructor output order with inheritance and virtual destructor.

Code snippet:

#include <iostream>
using namespace std;

class Base {
public:
    Base() { cout << "Base "; }
    virtual ~Base() { cout << "Destroy Base "; }
};

class Derived : public Base {
public:
    Derived() { cout << "Derived "; }
    ~Derived() { cout << "Destroy Derived "; }
};

int main() {
    Base* obj = new Derived();
    delete obj;
}`,
      options: [
        { optionId: "0", optionText: "Base Derived Destroy Derived Destroy Base" },
        { optionId: "1", optionText: "Base Derived Destroy Base" },
        { optionId: "2", optionText: "Base Destroy Base" },
        { optionId: "3", optionText: "Compilation Error" }
      ],
      correctOptionId: "0",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `Find the output of the recursive function for n = 6.

Code snippet:

int f(int n) {
  if (n == 0) return 0;
  return f(n / 2) + n % 2;
}

printf("%d", f(6));`,
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "2" },
        { optionId: "2", optionText: "3" },
        { optionId: "3", optionText: "4" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `Find the output using pointer arithmetic.

Code snippet:

int arr[] = {1, 2, 3, 4, 5};
int *p = arr + 2;
printf("%d %d", *(p - 1), *(p + 1));`,
      options: [
        { optionId: "0", optionText: "1 5" },
        { optionId: "1", optionText: "2 4" },
        { optionId: "2", optionText: "3 5" },
        { optionId: "3", optionText: "2 5" }
      ],
      correctOptionId: "1",
      matchRound: 2
    },
    {
      year: "2nd",
      questionText: `Determine JavaScript event loop output order.

Code snippet:

console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`,
      options: [
        { optionId: "0", optionText: "A B C D" },
        { optionId: "1", optionText: "A D B C" },
        { optionId: "2", optionText: "A D C B" },
        { optionId: "3", optionText: "C A D B" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `Check object-key coercion behavior in JavaScript objects.

Code snippet:

let a = {};
let b = {};
let c = {};

a[b] = 1;
a[c] = 2;
console.log(Object.keys(a).length);`,
      options: [
        { optionId: "0", optionText: "0" },
        { optionId: "1", optionText: "1" },
        { optionId: "2", optionText: "2" },
        { optionId: "3", optionText: "3" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `Understand shallow copy behavior in nested arrays in JavaScript.

Code snippet:

let a = [[1], [2]];
let b = [...a];
b[0][0] = 99;
console.log(a[0][0]);`,
      options: [
        { optionId: "0", optionText: "1" },
        { optionId: "1", optionText: "2" },
        { optionId: "2", optionText: "99" },
        { optionId: "3", optionText: "undefined" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `Identify which option is NOT required for deadlock.

Options:
A) Mutual Exclusion
B) Hold and Wait
C) Preemption
D) Circular Wait`,
      options: [
        { optionId: "0", optionText: "A) Mutual Exclusion" },
        { optionId: "1", optionText: "B) Hold and Wait" },
        { optionId: "2", optionText: "C) Preemption" },
        { optionId: "3", optionText: "D) Circular Wait" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `Using non-preemptive SJF scheduling, find execution order.

Given:
Process  Arrival  Burst
P1       0        5
P2       1        3
P3       2        1`,
      options: [
        { optionId: "0", optionText: "P1 -> P2 -> P3" },
        { optionId: "1", optionText: "P1 -> P3 -> P2" },
        { optionId: "2", optionText: "P3 -> P2 -> P1" },
        { optionId: "3", optionText: "P2 -> P3 -> P1" }
      ],
      correctOptionId: "1",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `If page size is 4 KB in a 32-bit logical address space, how many bits are used for page offset?`,
      options: [
        { optionId: "0", optionText: "8" },
        { optionId: "1", optionText: "10" },
        { optionId: "2", optionText: "12" },
        { optionId: "3", optionText: "16" }
      ],
      correctOptionId: "2",
      matchRound: 3
    },
    {
      year: "2nd",
      questionText: `Which mechanism most effectively prevents race conditions?`,
      options: [
        { optionId: "0", optionText: "Caching" },
        { optionId: "1", optionText: "Mutex Lock" },
        { optionId: "2", optionText: "Paging" },
        { optionId: "3", optionText: "Spooling" }
      ],
      correctOptionId: "1",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `What is this question asking?
In OSI/TCP-IP context, identify the layer responsible for end-to-end communication and reliability.`,
      options: [
        { optionId: "0", optionText: "Network" },
        { optionId: "1", optionText: "Transport" },
        { optionId: "2", optionText: "Data Link" },
        { optionId: "3", optionText: "Session" }
      ],
      correctOptionId: "1",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `Choose the true statement among TCP and UDP properties.

Options:
A) UDP guarantees delivery
B) TCP is connectionless
C) TCP ensures ordered delivery
D) UDP uses acknowledgments`,
      options: [
        { optionId: "0", optionText: "A" },
        { optionId: "1", optionText: "B" },
        { optionId: "2", optionText: "C" },
        { optionId: "3", optionText: "D" }
      ],
      correctOptionId: "2",
      matchRound: 4
    },
    {
      year: "2nd",
      questionText: `For a /24 subnet, find number of usable host IP addresses.`,
      options: [
        { optionId: "0", optionText: "252" },
        { optionId: "1", optionText: "253" },
        { optionId: "2", optionText: "254" },
        { optionId: "3", optionText: "256" }
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
