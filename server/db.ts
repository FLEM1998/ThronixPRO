// server/db.ts — Render Postgres (pg) + Drizzle

import dotenv from "dotenv";
dotenv.config(); // ensure .env is loaded before checks

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { fallbackDb, testFallbackConnection } from "./fallback-db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log("Initializing database connection...");

// Render external Postgres needs SSL. `sslmode=require` is in the URL,
// but pg also needs ssl config in some environments.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL in production; allow self-signed certs on hosted providers
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Optional tuning (safe defaults)
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 30_000,
});

const pgDb = drizzle(pool, { schema });

// Database selection logic with fallback
let usingFallback = false;

async function selectWorkingDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("Primary Postgres connection successful");
    return pgDb;
  } catch (error) {
    console.log("Primary Postgres connection failed, testing fallback…", (error as Error).message);

    const fallbackWorks = await testFallbackConnection();
    if (fallbackWorks) {
      console.log("Using fallback database connection");
      usingFallback = true;
      return fallbackDb;
    } else {
      console.error("Both primary and fallback connections failed");
      throw new Error("No working database connection available");
    }
  }
}

// Initialize working database
let workingDb: typeof pgDb | typeof fallbackDb | undefined;

selectWorkingDatabase()
  .then((db) => {
    workingDb = db;
    console.log(`Database initialized: ${usingFallback ? "Fallback" : "Primary Postgres"}`);
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    // last resort: keep app running with fallback in memory
    workingDb = fallbackDb;
    usingFallback = true;
  });

// Export a proxy so imports can use `db` immediately
export const db = new Proxy({} as typeof pgDb & typeof fallbackDb, {
  get(_target, prop: keyof (typeof pgDb & typeof fallbackDb)) {
    if (!workingDb) {
      // during startup, provide fallback to avoid crashes
      return (fallbackDb as any)[prop];
    }
    return (workingDb as any)[prop];
  },
});

export { usingFallback };

// Optional: wake the DB (useful on cold starts)
export async function activateDatabase(): Promise<boolean> {
  const maxRetries = 5;
  const delayMs = 1500;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("Database activated successfully");
      return true;
    } catch (e: any) {
      console.log(`Activation attempt ${attempt} failed: ${e.message}`);
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error("Database activation failed after all attempts");
  return false;
}

// Helpful connection logs
pool.on("connect", () => console.log("DB pool: connected"));
pool.on("error", (err) => console.error("DB pool error:", err));
