import { 
  users, tradingBots, positions, apiKeys, orderAlerts, liveOrders, marketData, advancedOrders, subscriptions,
  type User, type InsertUser,
  type TradingBot, type InsertTradingBot,
  type Position, type InsertPosition,
  type ApiKey, type InsertApiKey,
  type OrderAlert, type InsertOrderAlert,
  type LiveOrder, type InsertLiveOrder,
  type MarketData, type InsertMarketData,
  type AdvancedOrder, type InsertAdvancedOrder,
  type Subscription, type InsertSubscription
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { memoryDb } from "./memory-storage";
import { persistentStorage } from "./persistent-storage";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  setPasswordResetToken(email: string, token: string, expires: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, hashedPassword: string): Promise<boolean>;
  
  // Trading Bots
  getTradingBotsByUserId(userId: number): Promise<TradingBot[]>;
  getTradingBot(id: number): Promise<TradingBot | undefined>;
  createTradingBot(bot: InsertTradingBot): Promise<TradingBot>;
  updateTradingBot(id: number, updates: Partial<TradingBot>): Promise<TradingBot | undefined>;
  deleteTradingBot(id: number): Promise<boolean>;
  
  // Positions
  getPositionsByUserId(userId: number): Promise<Position[]>;
  getOpenPositionsByUserId(userId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, updates: Partial<Position>): Promise<Position | undefined>;
  
  // API Keys
  getApiKeysByUserId(userId: number): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<boolean>;
  
  // Order Alerts
  getOrderAlertsByUserId(userId: number, limit?: number): Promise<OrderAlert[]>;
  createOrderAlert(alert: InsertOrderAlert): Promise<OrderAlert>;
  
  // Live Orders
  getLiveOrdersByUserId(userId: number): Promise<LiveOrder[]>;
  createLiveOrder(order: InsertLiveOrder): Promise<LiveOrder>;
  updateLiveOrder(id: number, updates: Partial<LiveOrder>): Promise<LiveOrder | undefined>;
  deleteLiveOrder(id: number): Promise<boolean>;
  
  // Market Data
  getLatestMarketData(symbol: string, exchange: string): Promise<MarketData | undefined>;
  createMarketData(data: InsertMarketData): Promise<MarketData>;
  getTopMarketData(limit?: number): Promise<MarketData[]>;
  
  // Advanced Orders
  getAdvancedOrdersByUserId(userId: number): Promise<AdvancedOrder[]>;
  createAdvancedOrder(order: InsertAdvancedOrder): Promise<AdvancedOrder>;
  deleteAdvancedOrder(id: number): Promise<boolean>;
  
  // Trade History
  getTradeHistoryByUserId(userId: number): Promise<any[]>;
  
  // Subscription Management
  getUserSubscriptionStatus(userId: number): Promise<{ isActive: boolean; expiryDate?: string; productId?: string; provider?: string } | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  verifySubscription(userId: number, provider: string, purchaseToken?: string, purchaseId?: string): Promise<boolean>;

  /**
   * Fetch the most recently verified subscription record for a user. Returns
   * undefined if no subscription exists. This is used internally by the
   * subscription verification endpoint to determine whether to update an
   * existing record or create a new one.
   */
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
}

export class WorkingStorage implements IStorage {
  private usingMemory = false;

  private async executeWithFallback<T>(operation: () => Promise<T>, persistentOperation: () => Promise<T>): Promise<T> {
    try {
      // Try database operation first
      return await operation();
    } catch (error: any) {
      if (error.message?.includes('endpoint has been disabled') || error.message?.includes('database')) {
        console.log('Database failed, using persistent file storage for data safety...');
        this.usingMemory = true;
        return await persistentOperation();
      }
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.executeWithFallback(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
      },
      async () => persistentStorage.getUser(id)
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeWithFallback(
      async () => {
        const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
        return user || undefined;
      },
      async () => persistentStorage.getUserByEmail(email)
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.executeWithFallback(
      async () => {
        const hashedPassword = await bcrypt.hash(insertUser.password, 10);
        const [user] = await db
          .insert(users)
          .values({
            ...insertUser,
            password: hashedPassword,
            // Respect the emailVerified flag passed into createUser.  If not provided,
            // default to false.  This enables administrators or migrations to
            // pre-verify emails when appropriate.
            emailVerified: (insertUser as any).emailVerified ?? false,
          })
          .returning();
        return user;
      },
      async () => persistentStorage.createUser(insertUser)
    );
  }

  // The rest of WorkingStorage is unchanged…
  // (all other methods remain as in your original file)
}

export const storage = new WorkingStorage();
console.log('Working storage initialized with database fallback to memory');
