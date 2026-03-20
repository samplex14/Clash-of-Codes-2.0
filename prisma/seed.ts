import { prisma } from "../lib/db";
import { seedFirstYearQuestions } from "./seed1";
import { seedSecondYearQuestions } from "./seed2";

async function main(): Promise<void> {
  await prisma.question.deleteMany();

  console.log("Seeding first year questions...");
  await seedFirstYearQuestions();

  console.log("Seeding second year questions...");
  await seedSecondYearQuestions();

  console.log("Seeding complete.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
