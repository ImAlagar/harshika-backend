import 'dotenv/config';
import logger from "../utils/logger.js";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { PrismaClient } = pkg;
const { Pool } = pg;

let prisma;

try {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it in your .env file.");
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
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

  await prisma.$connect();
  logger.info("✅ Database connected successfully");

} catch (error) {
  logger.error("❌ Database connection failed:", error.message);
  process.exit(1);
}

export default prisma;
