import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    // Verify connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected (Neon PostgreSQL)");
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
