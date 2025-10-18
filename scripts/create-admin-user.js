// Create or update an admin user in the target database
// Usage (PowerShell):
//   node .\scripts\create-admin-user.js --username=admin --password=Secret123 --url="postgres://user:pass@host:5432/db?sslmode=require"
// If --url is omitted, POSTGRES_PRISMA_URL from environment will be used

const { PrismaClient } = require("@prisma/client");
const { createHmac, randomBytes } = require("crypto");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const [key, rawVal] = token.slice(2).split("=");
      if (rawVal !== undefined) {
        args[key] = rawVal;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args[key] = argv[++i];
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const h = createHmac("sha256", salt).update(String(plain)).digest("hex");
  return `${salt}:${h}`;
}

async function main() {
  const { username, password, role = "admin", url } = parseArgs(process.argv.slice(2));
  const datasourceUrl = url || process.env.POSTGRES_PRISMA_URL;
  if (!datasourceUrl) {
    console.error("Missing --url and POSTGRES_PRISMA_URL is not set.");
    process.exit(1);
  }
  if (!username || !password) {
    console.error("Usage: --username <name> --password <pass> [--url <postgres-url>] [--role admin]");
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });
  try {
    const passwordHash = hashPassword(String(password));
    const user = await prisma.user.upsert({
      where: { username: String(username) },
      update: { passwordHash, role: "admin" },
      create: { username: String(username), passwordHash, role: String(role) === "admin" ? "admin" : "admin" },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    console.log(JSON.stringify({ ok: true, user }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


