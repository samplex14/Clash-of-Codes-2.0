import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as GlobalWithPrisma;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export const prisma = db;
