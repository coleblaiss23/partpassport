import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. Neon serverless + Next.js hot reload can otherwise
 * exhaust connection pools with many PrismaClient instances.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
