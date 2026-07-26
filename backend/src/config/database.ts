import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Run queries one-at-a-time — required when DATABASE_URL uses a pooler with connection_limit=1. */
export async function runDbSequential<T extends readonly unknown[]>(
  tasks: [...{ [I in keyof T]: () => Promise<T[I]> }]
): Promise<T> {
  const results: unknown[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results as T;
}

export async function connectDatabase(): Promise<void> {
  try {
    // Do NOT call prisma.$connect() explicitly — Prisma connects lazily.
    // Calling $connect() before a query on a PgBouncer (transaction-mode) connection
    // can cause "prepared statement already exists" errors on hot reload because the
    // pooler reuses server connections across process restarts.
    //
    // Instead, issue a single lightweight query to verify the connection is reachable.
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected (Supabase PostgreSQL)");
  } catch (error: any) {
    console.error("❌ Database connection failed:");
    if (error.message?.includes("ENOTFOUND") || error.message?.includes("ECONNREFUSED")) {
      console.error("   Could not reach the database server.");
      console.error("   Verify DATABASE_URL in your .env file.");
    } else if (error.message?.includes("authentication")) {
      console.error("   Authentication failed. Check your credentials.");
    } else {
      console.error("  ", error.message || error);
    }
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
