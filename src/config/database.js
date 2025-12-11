// src/config/database.js
import 'dotenv/config';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

let prisma;

try {
  // Create connection pool for PostgreSQL
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  prisma = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty'
  });

  // Test connection
  await prisma.$connect();
  logger.info('✅ Database connected successfully');

} catch (error) {
  logger.error('❌ Database connection failed:', error.message);
  
  // Detailed error logging
  console.error('\n🔧 Debug Information:');
  console.error('Node Version:', process.version);
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.error('Database Host:', url.hostname);
    console.error('Database Port:', url.port);
    console.error('Database Name:', url.pathname.replace('/', ''));
  }
  
  console.error('\n💡 Solutions:');
  console.error('1. Check if database is running and accessible');
  console.error('2. Verify DATABASE_URL in .env file');
  console.error('3. For Neon: Use pooled connection URL ending with "-pooler"');
  console.error('4. Run: npx prisma generate');
  console.error('5. Check firewall settings for database access');
  
  process.exit(1);
}

// Graceful shutdown
const shutdown = async (signal) => {
  try {
    await prisma.$disconnect();
    logger.info(`🔌 Database disconnected (${signal})`);
    if (signal !== 'beforeExit') process.exit(0);
  } catch (error) {
    logger.error(`❌ Shutdown error (${signal}):`, error);
    process.exit(1);
  }
};

process.on('beforeExit', () => shutdown('beforeExit'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Health check
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.debug('💚 Database health OK');
    return true;
  } catch (error) {
    logger.error('💔 Database health check failed:', error.message);
    return false;
  }
};

export default prisma;