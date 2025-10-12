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

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: { db: { url: getOverrideDatasourceUrl() } }
  });
} else {
  if (!global.__prisma__) {
    global.__prisma__ = new PrismaClient({
      datasources: { db: { url: getOverrideDatasourceUrl() } }
    });
  }
  prisma = global.__prisma__;
}

export default prisma;


