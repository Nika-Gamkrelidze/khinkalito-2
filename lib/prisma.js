import { PrismaClient } from "@prisma/client";

// Prefer non-pooled connection locally to avoid port 6543 issues
function getOverrideDatasourceUrl() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return process.env.POSTGRES_PRISMA_URL || undefined;
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

// Create Prisma client with optimized connection pool settings
function createPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: getOverrideDatasourceUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  // In development, use global variable to prevent multiple instances during hot reload
  if (!global.__prisma__) {
    global.__prisma__ = createPrismaClient();
  }
  prisma = global.__prisma__;
}

// Graceful shutdown - disconnect on process exit
if (process.env.NODE_ENV !== "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;


