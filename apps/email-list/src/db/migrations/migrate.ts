import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const connectionConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
};

// Run migrations
async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    const connection = await mysql.createConnection(connectionConfig);
    const db = drizzle(connection);
    
    // This will run all migrations in the ./drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('Migrations completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
