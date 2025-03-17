import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || undefined,
    database: process.env.MYSQL_DB || '',
  },
  // Customize table names
  tablesFilter: ['email_list_*'],
} satisfies Config;
