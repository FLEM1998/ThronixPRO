import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { fallbackDb, testFallbackConnection } from './fallback-db';

// Configure WebSocket for Neon with enhanced settings
neonConfig.webSocketConstructor = ws;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Reduced for better control
  idleTimeoutMillis: 0, // Never timeout
  connectionTimeoutMillis: 60000, // 60 second timeout
});

const neonDb = drizzle({ client: pool, schema });

// Database selection logic with fallback
let usingFallback = false;

async function selectWorkingDatabase() {
  try {
    // Test Neon connection
    await pool.query('SELECT 1');
    console.log('Neon database connection successful');
    return neonDb;
  } catch (error) {
    console.log('Neon connection failed, testing fallback...');
    
    const fallbackWorks = await testFallbackConnection();
    if (fallbackWorks) {
      console.log('Using fallback database connection');
      usingFallback = true;
      return fallbackDb;
    } else {
      console.error('Both Neon and fallback connections failed');
      throw new Error('No working database connection available');
    }
  }
}

// Initialize working database
let workingDb: any;
selectWorkingDatabase().then(db => {
  workingDb = db;
  console.log(`Database initialized: ${usingFallback ? 'Fallback PostgreSQL' : 'Neon'}`);
}).catch(error => {
  console.error('Database initialization failed:', error);
  // Use fallback as last resort
  workingDb = fallbackDb;
  usingFallback = true;
});

export const db = new Proxy({}, {
  get(target, prop) {
    if (!workingDb) {
      // Return fallback during initialization
      return fallbackDb[prop as keyof typeof fallbackDb];
    }
    return workingDb[prop as keyof typeof workingDb];
  }
});

export { usingFallback };

// Database activation function with retry logic
export async function activateDatabase(): Promise<boolean> {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database activation attempt ${attempt}/${maxRetries}...`);
      
      // Simple query to wake up the database
      const result = await pool.query('SELECT 1 as test');
      
      if (result.rows && result.rows.length > 0) {
        console.log('Database activated successfully');
        return true;
      }
    } catch (error: any) {
      console.log(`Activation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('Database activation failed after all attempts');
  return false;
}

// Test database connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});