import { Pool } from 'pg';
import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';

// Fallback database configuration using standard PostgreSQL
const createFallbackDB = () => {
  console.log('Initializing fallback database connection...');
  
  // Use standard PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.on('connect', () => {
    console.log('Fallback database connected successfully');
  });

  pool.on('error', (err) => {
    console.error('Fallback database error:', err);
  });

  return drizzle(pool, { schema });
};

// Test connection function
export async function testFallbackConnection(): Promise<boolean> {
  try {
    const fallbackDb = createFallbackDB();
    await fallbackDb.execute('SELECT 1');
    console.log('Fallback database connection test successful');
    return true;
  } catch (error) {
    console.error('Fallback database connection test failed:', error);
    return false;
  }
}

export const fallbackDb = createFallbackDB();