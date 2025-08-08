import fs from 'fs/promises';
import path from 'path';
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

// File-based persistent storage for user data safety
class PersistentStorage {
  private dataDir = './data';
  private usersFile = path.join(this.dataDir, 'users.json');
  private tradingBotsFile = path.join(this.dataDir, 'trading-bots.json');
  private positionsFile = path.join(this.dataDir, 'positions.json');
  private apiKeysFile = path.join(this.dataDir, 'api-keys.json');
  private orderAlertsFile = path.join(this.dataDir, 'order-alerts.json');
  private liveOrdersFile = path.join(this.dataDir, 'live-orders.json');
  private advancedOrdersFile = path.join(this.dataDir, 'advanced-orders.json');

  private users: Map<number, User> = new Map();
  private tradingBots: Map<number, TradingBot> = new Map();
  private positions: Map<number, Position> = new Map();
  private apiKeys: Map<number, ApiKey> = new Map();
  private orderAlerts: Map<number, OrderAlert> = new Map();
  private liveOrders: Map<number, LiveOrder> = new Map();
  private advancedOrders: Map<number, AdvancedOrder> = new Map();
  
  private nextUserId = 1;
  private nextTradingBotId = 1;
  private nextPositionId = 1;
  private nextApiKeyId = 1;
  private nextOrderAlertId = 1;
  private nextLiveOrderId = 1;
  private nextAdvancedOrderId = 1;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing data
      await this.loadUsers();
      await this.loadTradingBots();
      await this.loadPositions();
      await this.loadApiKeys();
      await this.loadOrderAlerts();
      await this.loadLiveOrders();
      await this.loadAdvancedOrders();
      
      console.log('Persistent storage initialized with existing user data');
      console.log(`Loaded ${this.users.size} users, ${this.tradingBots.size} bots, ${this.positions.size} positions`);
    } catch (error) {
      console.error('Persistent storage initialization error:', error);
      console.log('Starting with empty persistent storage');
    }
  }

  private async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      const users: User[] = JSON.parse(data);
      users.forEach(user => {
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        if (user.verificationExpires) user.verificationExpires = new Date(user.verificationExpires);
        if (user.passwordResetExpires) user.passwordResetExpires = new Date(user.passwordResetExpires);
        
        this.users.set(user.id, user);
        if (user.id >= this.nextUserId) this.nextUserId = user.id + 1;
      });
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }
  }

  private async saveUsers() {
    try {
      const users = Array.from(this.users.values());
      await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private async loadTradingBots() {
    try {
      const data = await fs.readFile(this.tradingBotsFile, 'utf-8');
      const bots: TradingBot[] = JSON.parse(data);
      bots.forEach(bot => {
        bot.createdAt = new Date(bot.createdAt);
        bot.updatedAt = new Date(bot.updatedAt);
        this.tradingBots.set(bot.id, bot);
        if (bot.id >= this.nextTradingBotId) this.nextTradingBotId = bot.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async saveTradingBots() {
    try {
      const bots = Array.from(this.tradingBots.values());
      await fs.writeFile(this.tradingBotsFile, JSON.stringify(bots, null, 2));
    } catch (error) {
      console.error('Error saving trading bots:', error);
    }
  }

  private async loadPositions() {
    try {
      const data = await fs.readFile(this.positionsFile, 'utf-8');
      const positions: Position[] = JSON.parse(data);
      positions.forEach(position => {
        position.createdAt = new Date(position.createdAt);
        position.updatedAt = new Date(position.updatedAt);
        position.openTime = new Date(position.openTime);
        if (position.closeTime) position.closeTime = new Date(position.closeTime);
        this.positions.set(position.id, position);
        if (position.id >= this.nextPositionId) this.nextPositionId = position.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async savePositions() {
    try {
      const positions = Array.from(this.positions.values());
      await fs.writeFile(this.positionsFile, JSON.stringify(positions, null, 2));
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  }

  private async loadApiKeys() {
    try {
      const data = await fs.readFile(this.apiKeysFile, 'utf-8');
      const keys: ApiKey[] = JSON.parse(data);
      keys.forEach(key => {
        key.createdAt = new Date(key.createdAt);
        key.updatedAt = new Date(key.updatedAt);
        this.apiKeys.set(key.id, key);
        if (key.id >= this.nextApiKeyId) this.nextApiKeyId = key.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async saveApiKeys() {
    try {
      const keys = Array.from(this.apiKeys.values());
      await fs.writeFile(this.apiKeysFile, JSON.stringify(keys, null, 2));
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }

  private async loadOrderAlerts() {
    try {
      const data = await fs.readFile(this.orderAlertsFile, 'utf-8');
      const alerts: OrderAlert[] = JSON.parse(data);
      alerts.forEach(alert => {
        alert.createdAt = new Date(alert.createdAt);
        this.orderAlerts.set(alert.id, alert);
        if (alert.id >= this.nextOrderAlertId) this.nextOrderAlertId = alert.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async saveOrderAlerts() {
    try {
      const alerts = Array.from(this.orderAlerts.values());
      await fs.writeFile(this.orderAlertsFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('Error saving order alerts:', error);
    }
  }

  private async loadLiveOrders() {
    try {
      const data = await fs.readFile(this.liveOrdersFile, 'utf-8');
      const orders: LiveOrder[] = JSON.parse(data);
      orders.forEach(order => {
        order.createdAt = new Date(order.createdAt);
        order.updatedAt = new Date(order.updatedAt);
        this.liveOrders.set(order.id, order);
        if (order.id >= this.nextLiveOrderId) this.nextLiveOrderId = order.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async saveLiveOrders() {
    try {
      const orders = Array.from(this.liveOrders.values());
      await fs.writeFile(this.liveOrdersFile, JSON.stringify(orders, null, 2));
    } catch (error) {
      console.error('Error saving live orders:', error);
    }
  }

  private async loadAdvancedOrders() {
    try {
      const data = await fs.readFile(this.advancedOrdersFile, 'utf-8');
      const orders: AdvancedOrder[] = JSON.parse(data);
      orders.forEach(order => {
        order.createdAt = new Date(order.createdAt);
        order.updatedAt = new Date(order.updatedAt);
        this.advancedOrders.set(order.id, order);
        if (order.id >= this.nextAdvancedOrderId) this.nextAdvancedOrderId = order.id + 1;
      });
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }

  private async saveAdvancedOrders() {
    try {
      const orders = Array.from(this.advancedOrders.values());
      await fs.writeFile(this.advancedOrdersFile, JSON.stringify(orders, null, 2));
    } catch (error) {
      console.error('Error saving advanced orders:', error);
    }
  }

  // User operations with persistent storage
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
    await this.saveUsers(); // Persist to file immediately
    console.log(`User persistently saved: ${user.email} (ID: ${user.id})`);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    await this.saveUsers(); // Persist changes
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

  // Trading Bot operations with persistence
  async getTradingBotsByUserId(userId: number): Promise<TradingBot[]> {
    return Array.from(this.tradingBots.values()).filter(bot => bot.userId === userId);
  }

  async createTradingBot(insertBot: InsertTradingBot): Promise<TradingBot> {
    const bot: TradingBot = {
      id: this.nextTradingBotId++,
      userId: insertBot.userId,
      name: insertBot.name,
      symbol: insertBot.symbol,
      strategy: insertBot.strategy,
      exchange: insertBot.exchange,
      status: insertBot.status,
      quoteAmount: insertBot.quoteAmount,
      pnl: insertBot.pnl,
      stopLoss: insertBot.stopLoss,
      takeProfit: insertBot.takeProfit,
      trailingStop: insertBot.trailingStop,
      gridLevels: insertBot.gridLevels,
      dcaSteps: insertBot.dcaSteps,
      maxDrawdown: insertBot.maxDrawdown,
      positionSize: insertBot.positionSize,
      slippageTolerance: insertBot.slippageTolerance,
      rsiThreshold: insertBot.rsiThreshold,
      volumeThreshold: insertBot.volumeThreshold,
      priceThreshold: insertBot.priceThreshold,
      timeframe: insertBot.timeframe,
      indicators: insertBot.indicators,
      riskLevel: insertBot.riskLevel,
      automatedTakeProfit: insertBot.automatedTakeProfit,
      maxPositions: insertBot.maxPositions,
      hedgingEnabled: insertBot.hedgingEnabled,
      emergencyStop: insertBot.emergencyStop,
      backtestResults: insertBot.backtestResults,
      totalTrades: insertBot.totalTrades || 0,
      winRate: insertBot.winRate || "0",
      lastActive: insertBot.lastActive,
      apiKeyId: insertBot.apiKeyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tradingBots.set(bot.id, bot);
    await this.saveTradingBots(); // Persist to file
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
    await this.saveTradingBots();
    return updatedBot;
  }

  async deleteTradingBot(id: number): Promise<boolean> {
    const deleted = this.tradingBots.delete(id);
    if (deleted) {
      await this.saveTradingBots();
    }
    return deleted;
  }

  // Position operations with persistence
  async getPositionsByUserId(userId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(pos => pos.userId === userId);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const position: Position = {
      id: this.nextPositionId++,
      userId: insertPosition.userId,
      symbol: insertPosition.symbol,
      side: insertPosition.side,
      quantity: insertPosition.quantity,
      entryPrice: insertPosition.entryPrice,
      currentPrice: insertPosition.currentPrice,
      pnl: insertPosition.pnl,
      status: insertPosition.status,
      botId: insertPosition.botId,
      openTime: insertPosition.openTime,
      closeTime: insertPosition.closeTime,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.positions.set(position.id, position);
    await this.savePositions();
    return position;
  }

  // API Key operations with persistence
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
    await this.saveApiKeys();
    return apiKey;
  }

  // Order Alert operations with persistence
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
    await this.saveOrderAlerts();
    return alert;
  }

  // Live Order operations with persistence
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
    await this.saveLiveOrders();
    return order;
  }

  // Advanced Order operations with persistence
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
    await this.saveAdvancedOrders();
    return order;
  }

  // Market Data operations
  async getLatestMarketData(): Promise<MarketData[]> {
    return []; // Market data is live from exchanges, not stored
  }

  async getTradeHistoryByUserId(userId: number): Promise<any[]> {
    return []; // Trade history would come from connected exchanges
  }
}

export const persistentStorage = new PersistentStorage();
console.log('Persistent file-based storage initialized - user data is now permanently saved');