import bcrypt from "bcryptjs";
import type {
  User, InsertUser,
  TradingBot, InsertTradingBot,
  Position, InsertPosition,
  ApiKey, InsertApiKey,
  OrderAlert, InsertOrderAlert,
  LiveOrder, InsertLiveOrder,
  MarketData, InsertMarketData,
  AdvancedOrder, InsertAdvancedOrder
} from "@shared/schema";

// In-memory storage for immediate functionality
class MemoryDatabase {
  private users: Map<number, User> = new Map();
  private tradingBots: Map<number, TradingBot> = new Map();
  private positions: Map<number, Position> = new Map();
  private apiKeys: Map<number, ApiKey> = new Map();
  private orderAlerts: Map<number, OrderAlert> = new Map();
  private liveOrders: Map<number, LiveOrder> = new Map();
  private marketData: Map<number, MarketData> = new Map();
  private advancedOrders: Map<number, AdvancedOrder> = new Map();
  
  private nextUserId = 1;
  private nextTradingBotId = 1;
  private nextPositionId = 1;
  private nextApiKeyId = 1;
  private nextOrderAlertId = 1;
  private nextLiveOrderId = 1;
  private nextMarketDataId = 1;
  private nextAdvancedOrderId = 1;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: this.nextUserId++,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken: null,
      verificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    console.log(`User created in memory: ${user.email} (ID: ${user.id})`);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.verificationToken === token) {
        return user;
      }
    }
    return undefined;
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    
    await this.updateUser(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires
    });
    return true;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.passwordResetToken === token && user.passwordResetExpires && user.passwordResetExpires > new Date()) {
        return user;
      }
    }
    return undefined;
  }

  // Trading Bot operations
  async getTradingBotsByUserId(userId: number): Promise<TradingBot[]> {
    return Array.from(this.tradingBots.values()).filter(bot => bot.userId === userId);
  }

  async createTradingBot(insertBot: InsertTradingBot): Promise<TradingBot> {
    const bot: TradingBot = {
      id: this.nextTradingBotId++,
      ...insertBot,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tradingBots.set(bot.id, bot);
    return bot;
  }

  async getTradingBot(id: number): Promise<TradingBot | undefined> {
    return this.tradingBots.get(id);
  }

  async updateTradingBot(id: number, updates: Partial<TradingBot>): Promise<TradingBot | undefined> {
    const bot = this.tradingBots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates, updatedAt: new Date() };
    this.tradingBots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteTradingBot(id: number): Promise<boolean> {
    return this.tradingBots.delete(id);
  }

  // Position operations
  async getPositionsByUserId(userId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(pos => pos.userId === userId);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const position: Position = {
      id: this.nextPositionId++,
      ...insertPosition,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.positions.set(position.id, position);
    return position;
  }

  // API Key operations
  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: this.nextApiKeyId++,
      ...insertApiKey,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.apiKeys.set(apiKey.id, apiKey);
    return apiKey;
  }

  // Order Alert operations
  async getOrderAlertsByUserId(userId: number): Promise<OrderAlert[]> {
    return Array.from(this.orderAlerts.values()).filter(alert => alert.userId === userId);
  }

  async createOrderAlert(insertAlert: InsertOrderAlert): Promise<OrderAlert> {
    const alert: OrderAlert = {
      id: this.nextOrderAlertId++,
      ...insertAlert,
      createdAt: new Date()
    };
    
    this.orderAlerts.set(alert.id, alert);
    return alert;
  }

  // Live Order operations
  async getLiveOrdersByUserId(userId: number): Promise<LiveOrder[]> {
    return Array.from(this.liveOrders.values()).filter(order => order.userId === userId);
  }

  async createLiveOrder(insertOrder: InsertLiveOrder): Promise<LiveOrder> {
    const order: LiveOrder = {
      id: this.nextLiveOrderId++,
      ...insertOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.liveOrders.set(order.id, order);
    return order;
  }

  // Advanced Order operations
  async getAdvancedOrdersByUserId(userId: number): Promise<AdvancedOrder[]> {
    return Array.from(this.advancedOrders.values()).filter(order => order.userId === userId);
  }

  async createAdvancedOrder(insertOrder: InsertAdvancedOrder): Promise<AdvancedOrder> {
    const order: AdvancedOrder = {
      id: this.nextAdvancedOrderId++,
      ...insertOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.advancedOrders.set(order.id, order);
    return order;
  }

  // Market Data operations
  async getLatestMarketData(): Promise<MarketData[]> {
    return Array.from(this.marketData.values());
  }

  async getTradeHistoryByUserId(userId: number): Promise<any[]> {
    // Return empty array for now - trade history would be populated by actual trading
    return [];
  }
}

export const memoryDb = new MemoryDatabase();
console.log('Memory database initialized and ready for immediate use');