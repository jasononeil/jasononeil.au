import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Database connection configuration
const connectionConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
};

// Create a connection pool
const connectionPool = mysql.createPool(connectionConfig);

// Create a Drizzle instance
export const db = drizzle(connectionPool, { schema, mode: 'default' });

// Helper function to test the database connection
export async function testConnection() {
  try {
    const [result] = await connectionPool.execute('SELECT 1 as test');
    return { success: true, result };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, error };
  }
}

// Export schema for use in other files
export { schema };
