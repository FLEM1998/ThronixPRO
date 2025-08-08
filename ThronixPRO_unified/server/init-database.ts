import { sql } from "drizzle-orm";
import { db, pool } from "./db";
import { users, tradingBots, positions, apiKeys, orderAlerts, liveOrders, marketData, advancedOrders } from "@shared/schema";

export async function initializeDatabase(): Promise<boolean> {
  const maxRetries = 10;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Database initialization attempt ${attempt}/${maxRetries}...`);
    
    try {
      // First, try to wake up the database with a simple query
      await pool.query('SELECT NOW()');
      console.log('Database connection established');
      
      // Create tables if they don't exist
      await createTablesIfNotExist();
      console.log('Database tables verified/created successfully');
      return true;
      
    } catch (error: any) {
      console.log(`Initialization attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * attempt, 5000); // Progressive delay up to 5 seconds
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('Database initialization failed after all attempts');
  return false;
}

async function createTablesIfNotExist(): Promise<void> {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create trading_bots table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trading_bots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        strategy VARCHAR(100) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        exchange VARCHAR(50) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create positions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        side VARCHAR(10) NOT NULL,
        size DECIMAL(20,8) NOT NULL,
        entry_price DECIMAL(20,8) NOT NULL,
        current_price DECIMAL(20,8),
        pnl DECIMAL(20,8) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'open',
        exchange VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create api_keys table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exchange VARCHAR(50) NOT NULL,
        api_key TEXT NOT NULL,
        api_secret TEXT NOT NULL,
        passphrase TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create order_alerts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        symbol VARCHAR(50),
        exchange VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create live_orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS live_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exchange_order_id VARCHAR(255),
        symbol VARCHAR(50) NOT NULL,
        side VARCHAR(10) NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        price DECIMAL(20,8),
        status VARCHAR(20) DEFAULT 'pending',
        exchange VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create market_data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        exchange VARCHAR(50) NOT NULL,
        price DECIMAL(20,8) NOT NULL,
        volume DECIMAL(20,8),
        change_24h DECIMAL(10,4),
        high_24h DECIMAL(20,8),
        low_24h DECIMAL(20,8),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create advanced_orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS advanced_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        side VARCHAR(10) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        trigger_price DECIMAL(20,8),
        limit_price DECIMAL(20,8),
        stop_price DECIMAL(20,8),
        status VARCHAR(20) DEFAULT 'pending',
        exchange VARCHAR(50) NOT NULL,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('All database tables verified/created');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}