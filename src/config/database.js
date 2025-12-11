// src/config/database.js
import 'dotenv/config';
import logger from "../utils/logger.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

let prisma;

try {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it in your .env file.");
  }

  // PostgreSQL connection pool
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Important for Neon
    },
  });

  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
    errorFormat: "pretty",
  });

  // Test connection
  await prisma.$connect();
  logger.info("✅ Database connected successfully");

} catch (error) {
  logger.error("❌ Database connection failed:", error.message);

  console.error("\n🔧 Debug Info:");
  console.error("Node Version:", process.version);
  console.error("ENV:", process.env.NODE_ENV);
  console.error("DATABASE_URL exists:", Boolean(process.env.DATABASE_URL));

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.error("DB Host:", url.hostname);
    console.error("DB Port:", url.port);
    console.error("DB Name:", url.pathname.replace("/", ""));
  }

  console.error("\n💡 Fixes:");
  console.error("1. Use Neon pooled connection URL (ending with '-pooler').");
  console.error("2. Run: npx prisma generate");
  console.error("3. Check DB firewall / permissions.");
  console.error("4. Ensure SSL = true for Neon.");

  process.exit(1);
}

// Graceful shutdown
const shutdown = async (signal) => {
  try {
    await prisma.$disconnect();
    logger.info(`🔌 Prisma disconnected (${signal})`);
    process.exit(0);
  } catch (err) {
    logger.error("Shutdown error:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Health Check helper
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    logger.error("💔 DB Health check failed:", err.message);
    return false;
  }
};

export default prisma;
