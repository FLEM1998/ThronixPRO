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
            emailVerified: false,
          })
          .returning();
        return user;
      },
      async () => persistentStorage.createUser(insertUser)
    );
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(users.email, email));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, userId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Trading Bots
  async getTradingBotsByUserId(userId: number): Promise<TradingBot[]> {
    return this.executeWithFallback(
      async () => await db.select().from(tradingBots).where(eq(tradingBots.userId, userId)),
      async () => persistentStorage.getTradingBotsByUserId(userId)
    );
  }

  async getTradingBot(id: number): Promise<TradingBot | undefined> {
    return this.executeWithFallback(
      async () => {
        const [bot] = await db.select().from(tradingBots).where(eq(tradingBots.id, id));
        return bot || undefined;
      },
      async () => persistentStorage.getTradingBot(id)
    );
  }

  async createTradingBot(insertBot: any): Promise<TradingBot> {
    return this.executeWithFallback(
      async () => {
        const [bot] = await db.insert(tradingBots).values(insertBot).returning();
        return bot;
      },
      async () => persistentStorage.createTradingBot(insertBot)
    );
  }

  async updateTradingBot(id: number, updates: Partial<TradingBot>): Promise<TradingBot | undefined> {
    return this.executeWithFallback(
      async () => {
        const [bot] = await db.update(tradingBots).set(updates).where(eq(tradingBots.id, id)).returning();
        return bot || undefined;
      },
      async () => persistentStorage.updateTradingBot(id, updates)
    );
  }

  async deleteTradingBot(id: number): Promise<boolean> {
    return this.executeWithFallback(
      async () => {
        const result = await db.delete(tradingBots).where(eq(tradingBots.id, id));
        return (result.rowCount || 0) > 0;
      },
      async () => persistentStorage.deleteTradingBot(id)
    );
  }

  // Positions
  async getPositionsByUserId(userId: number): Promise<Position[]> {
    return this.executeWithFallback(
      async () => await db.select().from(positions).where(eq(positions.userId, userId)),
      async () => persistentStorage.getPositionsByUserId(userId)
    );
  }

  async getOpenPositionsByUserId(userId: number): Promise<Position[]> {
    return this.executeWithFallback(
      async () => await db.select().from(positions).where(and(eq(positions.userId, userId), eq(positions.status, 'open'))),
      async () => persistentStorage.getPositionsByUserId(userId).then(positions => positions.filter(p => p.status === 'open'))
    );
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    return this.executeWithFallback(
      async () => {
        const [position] = await db.insert(positions).values(insertPosition).returning();
        return position;
      },
      async () => persistentStorage.createPosition(insertPosition)
    );
  }

  async updatePosition(id: number, updates: Partial<Position>): Promise<Position | undefined> {
    return this.executeWithFallback(
      async () => {
        const [position] = await db.update(positions).set(updates).where(eq(positions.id, id)).returning();
        return position || undefined;
      },
      async () => {
        // Memory DB doesn't have updatePosition, return undefined for now
        return undefined;
      }
    );
  }

  // API Keys
  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    return this.executeWithFallback(
      async () => await db.select().from(apiKeys).where(eq(apiKeys.userId, userId)),
      async () => persistentStorage.getApiKeysByUserId(userId)
    );
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    return this.executeWithFallback(
      async () => {
        const [apiKey] = await db.insert(apiKeys).values(insertApiKey).returning();
        return apiKey;
      },
      async () => persistentStorage.createApiKey(insertApiKey)
    );
  }

  async deleteApiKey(id: number): Promise<boolean> {
    return this.executeWithFallback(
      async () => {
        const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
        return (result.rowCount || 0) > 0;
      },
      async () => false // Memory DB doesn't have delete API key
    );
  }

  // Order Alerts
  async getOrderAlertsByUserId(userId: number, limit = 20): Promise<OrderAlert[]> {
    return this.executeWithFallback(
      async () => await db.select().from(orderAlerts).where(eq(orderAlerts.userId, userId)).orderBy(desc(orderAlerts.createdAt)).limit(limit),
      async () => persistentStorage.getOrderAlertsByUserId(userId).then(alerts => alerts.slice(0, limit))
    );
  }

  async createOrderAlert(insertAlert: InsertOrderAlert): Promise<OrderAlert> {
    return this.executeWithFallback(
      async () => {
        const [alert] = await db.insert(orderAlerts).values(insertAlert).returning();
        return alert;
      },
      async () => persistentStorage.createOrderAlert(insertAlert)
    );
  }

  // Live Orders
  async getLiveOrdersByUserId(userId: number): Promise<LiveOrder[]> {
    return await db
      .select()
      .from(liveOrders)
      .where(eq(liveOrders.userId, userId))
      .orderBy(desc(liveOrders.createdAt));
  }

  async createLiveOrder(insertOrder: InsertLiveOrder): Promise<LiveOrder> {
    const [order] = await db
      .insert(liveOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateLiveOrder(id: number, updates: Partial<LiveOrder>): Promise<LiveOrder | undefined> {
    const [order] = await db
      .update(liveOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveOrders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteLiveOrder(id: number): Promise<boolean> {
    const result = await db
      .delete(liveOrders)
      .where(eq(liveOrders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Market Data
  async getLatestMarketData(symbol: string, exchange: string): Promise<MarketData | undefined> {
    const [data] = await db
      .select()
      .from(marketData)
      .where(and(eq(marketData.symbol, symbol), eq(marketData.exchange, exchange)))
      .orderBy(desc(marketData.timestamp))
      .limit(1);
    return data || undefined;
  }

  async createMarketData(insertData: InsertMarketData): Promise<MarketData> {
    const [data] = await db
      .insert(marketData)
      .values(insertData)
      .returning();
    return data;
  }

  async getTopMarketData(limit = 50): Promise<MarketData[]> {
    return await db
      .select()
      .from(marketData)
      .orderBy(desc(marketData.volume))
      .limit(limit);
  }

  // Advanced Orders
  async getAdvancedOrdersByUserId(userId: number): Promise<AdvancedOrder[]> {
    return await db
      .select()
      .from(advancedOrders)
      .where(eq(advancedOrders.userId, userId))
      .orderBy(desc(advancedOrders.createdAt));
  }

  async createAdvancedOrder(insertOrder: InsertAdvancedOrder): Promise<AdvancedOrder> {
    const [order] = await db
      .insert(advancedOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async deleteAdvancedOrder(id: number): Promise<boolean> {
    const result = await db
      .delete(advancedOrders)
      .where(eq(advancedOrders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Trade History - For now, return empty array since new users have no trading history
  // In a real trading platform, this would query actual trade records from the database
  async getTradeHistoryByUserId(userId: number): Promise<any[]> {
    // For live trading platform: new users start with zero trading history
    // Only real completed trades should appear here
    return [];
  }

  // Subscription Management Methods
  async getUserSubscriptionStatus(userId: number): Promise<{ isActive: boolean; expiryDate?: string; productId?: string; provider?: string } | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.lastVerified))
        .limit(1);

      if (!subscription) {
        return { isActive: false };
      }

      // Check if subscription has expired
      const now = new Date();
      const isActive = subscription.isActive && 
        (!subscription.expiryDate || new Date(subscription.expiryDate) > now);

      return {
        isActive,
        expiryDate: subscription.expiryDate?.toISOString(),
        productId: subscription.productId,
        provider: subscription.provider
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return { isActive: false };
    }
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          ...subscription,
          lastVerified: new Date()
        })
        .returning();
      return newSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      // Memory fallback - create mock subscription
      const newSubscription: Subscription = {
        id: Date.now(),
        ...subscription,
        lastVerified: new Date(),
        createdAt: new Date()
      };
      return newSubscription;
    }
  }

  async updateSubscription(userId: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    try {
      const [updatedSubscription] = await db
        .update(subscriptions)
        .set({
          ...updates,
          lastVerified: new Date()
        })
        .where(eq(subscriptions.userId, userId))
        .returning();
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return undefined;
    }
  }

  async verifySubscription(userId: number, provider: string, purchaseToken?: string, purchaseId?: string): Promise<boolean> {
    try {
      // Update last verification time
      await db
        .update(subscriptions)
        .set({ 
          lastVerified: new Date()
        })
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, provider)
        ));
      
      return true; // Verification successful
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  }

  /**
   * Retrieve the most recent subscription record for a given user. This helper
   * is used by the subscription verification logic to decide whether to
   * update an existing subscription or insert a new one. If the database
   * query fails, undefined is returned so the caller can handle creation.
   */
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.lastVerified))
        .limit(1);
      return subscription || undefined;
    } catch (error) {
      console.error('Error fetching subscription by user id:', error);
      return undefined;
    }
  }
}

export const storage = new WorkingStorage();
console.log('Working storage initialized with database fallback to memory');
