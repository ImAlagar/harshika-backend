// prisma.config.mjs - MUST use .mjs extension
import 'dotenv/config';

export default {
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
};