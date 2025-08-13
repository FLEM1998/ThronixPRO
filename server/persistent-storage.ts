import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

import type {
  User, InsertUser,
  TradingBot, InsertTradingBot,
  Position, InsertPosition,
  ApiKey, InsertApiKey,
  OrderAlert, InsertOrderAlert,
  LiveOrder, InsertLiveOrder,
  MarketData, InsertMarketData,
  AdvancedOrder, InsertAdvancedOrder,
  Subscription, InsertSubscription, SubscriptionUpdate,
} from '@shared/schema';

/**
 * File-based persistent storage for production-ish durability on Render free tier.
 * NOTE: This mirrors your Drizzle schema types, so fields not present in the schema
 * are intentionally avoided (e.g., no generic updatedAt for entities that don't have it).
 */
class PersistentStorage {
  private dataDir = './data';

  private usersFile = path.join(this.dataDir, 'users.json');
  private tradingBotsFile = path.join(this.dataDir, 'trading-bots.json');
  private positionsFile = path.join(this.dataDir, 'positions.json');
  private apiKeysFile = path.join(this.dataDir, 'api-keys.json');
  private orderAlertsFile = path.join(this.dataDir, 'order-alerts.json');
  private liveOrdersFile = path.join(this.dataDir, 'live-orders.json');
  private advancedOrdersFile = path.join(this.dataDir, 'advanced-orders.json');
  private subscriptionsFile = path.join(this.dataDir, 'subscriptions.json');

  private users: Map<number, User> = new Map();
  private tradingBots: Map<number, TradingBot> = new Map();
  private positions: Map<number, Position> = new Map();
  private apiKeys: Map<number, ApiKey> = new Map();
  private orderAlerts: Map<number, OrderAlert> = new Map();
  private liveOrders: Map<number, LiveOrder> = new Map();
  private advancedOrders: Map<number, AdvancedOrder> = new Map();
  private subscriptions: Map<number, Subscription> = new Map(); // keyed by subscription id

  private nextUserId = 1;
  private nextTradingBotId = 1;
  private nextPositionId = 1;
  private nextApiKeyId = 1;
  private nextOrderAlertId = 1;
  private nextLiveOrderId = 1;
  private nextAdvancedOrderId = 1;
  private nextSubscriptionId = 1;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      await this.loadUsers();
      await this.loadTradingBots();
      await this.loadPositions();
      await this.loadApiKeys();
      await this.loadOrderAlerts();
      await this.loadLiveOrders();
      await this.loadAdvancedOrders();
      await this.loadSubscriptions();

      console.log('Persistent storage initialized.');
      console.log(
        `Loaded: users=${this.users.size}, bots=${this.tradingBots.size}, positions=${this.positions.size}, subs=${this.subscriptions.size}`
      );
    } catch (err) {
      console.error('Persistent storage initialization error:', err);
      console.log('Starting with empty persistent storage');
    }
  }

  /* ----------------------------- Load/Save helpers ----------------------------- */

  private async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      const items: User[] = JSON.parse(data);
      for (const u of items) {
        // Convert dates if present
        if (u.createdAt) (u as any).createdAt = new Date(u.createdAt);
        if ((u as any).verificationExpires) (u as any).verificationExpires = new Date((u as any).verificationExpires);
        if ((u as any).passwordResetExpires) (u as any).passwordResetExpires = new Date((u as any).passwordResetExpires);
        this.users.set(u.id, u);
        if (u.id >= this.nextUserId) this.nextUserId = u.id + 1;
      }
    } catch {}
  }
  private async saveUsers() {
    try {
      await fs.writeFile(this.usersFile, JSON.stringify([...this.users.values()], null, 2));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  private async loadTradingBots() {
    try {
      const data = await fs.readFile(this.tradingBotsFile, 'utf-8');
      const items: TradingBot[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        if ((it as any).updatedAt) (it as any).updatedAt = new Date((it as any).updatedAt);
        this.tradingBots.set(it.id, it);
        if (it.id >= this.nextTradingBotId) this.nextTradingBotId = it.id + 1;
      }
    } catch {}
  }
  private async saveTradingBots() {
    try {
      await fs.writeFile(this.tradingBotsFile, JSON.stringify([...this.tradingBots.values()], null, 2));
    } catch (e) {
      console.error('Error saving trading bots:', e);
    }
  }

  private async loadPositions() {
    try {
      const data = await fs.readFile(this.positionsFile, 'utf-8');
      const items: Position[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).openTime) (it as any).openTime = new Date((it as any).openTime);
        if ((it as any).closeTime) (it as any).closeTime = new Date((it as any).closeTime);
        this.positions.set(it.id, it);
        if (it.id >= this.nextPositionId) this.nextPositionId = it.id + 1;
      }
    } catch {}
  }
  private async savePositions() {
    try {
      await fs.writeFile(this.positionsFile, JSON.stringify([...this.positions.values()], null, 2));
    } catch (e) {
      console.error('Error saving positions:', e);
    }
  }

  private async loadApiKeys() {
    try {
      const data = await fs.readFile(this.apiKeysFile, 'utf-8');
      const items: ApiKey[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        this.apiKeys.set(it.id, it);
        if (it.id >= this.nextApiKeyId) this.nextApiKeyId = it.id + 1;
      }
    } catch {}
  }
  private async saveApiKeys() {
    try {
      await fs.writeFile(this.apiKeysFile, JSON.stringify([...this.apiKeys.values()], null, 2));
    } catch (e) {
      console.error('Error saving API keys:', e);
    }
  }

  private async loadOrderAlerts() {
    try {
      const data = await fs.readFile(this.orderAlertsFile, 'utf-8');
      const items: OrderAlert[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        this.orderAlerts.set(it.id, it);
        if (it.id >= this.nextOrderAlertId) this.nextOrderAlertId = it.id + 1;
      }
    } catch {}
  }
  private async saveOrderAlerts() {
    try {
      await fs.writeFile(this.orderAlertsFile, JSON.stringify([...this.orderAlerts.values()], null, 2));
    } catch (e) {
      console.error('Error saving order alerts:', e);
    }
  }

  private async loadLiveOrders() {
    try {
      const data = await fs.readFile(this.liveOrdersFile, 'utf-8');
      const items: LiveOrder[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        if ((it as any).updatedAt) (it as any).updatedAt = new Date((it as any).updatedAt);
        this.liveOrders.set(it.id, it);
        if (it.id >= this.nextLiveOrderId) this.nextLiveOrderId = it.id + 1;
      }
    } catch {}
  }
  private async saveLiveOrders() {
    try {
      await fs.writeFile(this.liveOrdersFile, JSON.stringify([...this.liveOrders.values()], null, 2));
    } catch (e) {
      console.error('Error saving live orders:', e);
    }
  }

  private async loadAdvancedOrders() {
    try {
      const data = await fs.readFile(this.advancedOrdersFile, 'utf-8');
      const items: AdvancedOrder[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        this.advancedOrders.set(it.id, it);
        if (it.id >= this.nextAdvancedOrderId) this.nextAdvancedOrderId = it.id + 1;
      }
    } catch {}
  }
  private async saveAdvancedOrders() {
    try {
      await fs.writeFile(this.advancedOrdersFile, JSON.stringify([...this.advancedOrders.values()], null, 2));
    } catch (e) {
      console.error('Error saving advanced orders:', e);
    }
  }

  private async loadSubscriptions() {
    try {
      const data = await fs.readFile(this.subscriptionsFile, 'utf-8');
      const items: Subscription[] = JSON.parse(data);
      for (const it of items) {
        if ((it as any).createdAt) (it as any).createdAt = new Date((it as any).createdAt);
        if ((it as any).updatedAt) (it as any).updatedAt = new Date((it as any).updatedAt);
        if ((it as any).expiryDate) (it as any).expiryDate = new Date((it as any).expiryDate);
        if ((it as any).lastVerified) (it as any).lastVerified = new Date((it as any).lastVerified);
        this.subscriptions.set(it.id, it);
        if (it.id >= this.nextSubscriptionId) this.nextSubscriptionId = it.id + 1;
      }
    } catch {}
  }
  private async saveSubscriptions() {
    try {
      await fs.writeFile(this.subscriptionsFile, JSON.stringify([...this.subscriptions.values()], null, 2));
    } catch (e) {
      console.error('Error saving subscriptions:', e);
    }
  }

  /* ---------------------------------- Users ---------------------------------- */

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === email.toLowerCase()) return user;
    }
    return undefined;
  }

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if ((user as any).deviceId && (user as any).deviceId === deviceId) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Enforce one-account-per-device if deviceId provided
    const deviceId = (insertUser as any).deviceId as string | undefined;
    if (deviceId) {
      const existing = await this.getUserByDeviceId(deviceId);
      if (existing) {
        throw new Error('DEVICE_ALREADY_REGISTERED');
      }
    }

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
      // @ts-expect-error deviceId exists in your updated schema
      deviceId: deviceId ?? null,
      createdAt: new Date(),
    } as any;

    this.users.set(user.id, user);
    await this.saveUsers();
    console.log(`User saved: ${user.email} (ID: ${user.id})`);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    // If updating deviceId, enforce uniqueness
    if ((updates as any).deviceId) {
      const existing = await this.getUserByDeviceId((updates as any).deviceId as string);
      if (existing && existing.id !== id) {
        throw new Error('DEVICE_ALREADY_REGISTERED');
      }
    }

    const next = { ...user, ...updates } as User;
    this.users.set(id, next);
    await this.saveUsers();
    return next;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    const next = {
      ...user,
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    } as User;
    this.users.set(id, next);
    await this.saveUsers();
    return true;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.verificationToken === token) return user;
    }
    return undefined;
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    await this.updateUser(user.id, { passwordResetToken: token, passwordResetExpires: expires } as any);
    return true;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (
        user.passwordResetToken === token &&
        user.passwordResetExpires &&
        user.passwordResetExpires > new Date()
      ) {
        return user;
      }
    }
    return undefined;
  }

  // Alias for routes using getUserByResetToken
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return this.getUserByPasswordResetToken(token);
  }

  /* ------------------------------- Trading Bots ------------------------------- */

  async getTradingBotsByUserId(userId: number): Promise<TradingBot[]> {
    return [...this.tradingBots.values()].filter((b) => b.userId === userId);
  }

  async createTradingBot(insertBot: InsertTradingBot & { userId: number }): Promise<TradingBot> {
    // Keep exactly the fields defined in your schema
    const bot: TradingBot = {
      id: this.nextTradingBotId++,
      userId: insertBot.userId,
      name: insertBot.name,
      symbol: insertBot.symbol,
      strategy: insertBot.strategy,
      status: insertBot.status,
      exchange: insertBot.exchange,

      quoteAmount: (insertBot as any).quoteAmount ?? null,
      pnl: (insertBot as any).pnl ?? '0',

      stopLoss: (insertBot as any).stopLoss ?? null,
      takeProfit: (insertBot as any).takeProfit ?? null,
      trailingStopPercent: (insertBot as any).trailingStopPercent ?? null,
      maxDrawdown: (insertBot as any).maxDrawdown ?? null,

      gridLevels: (insertBot as any).gridLevels ?? null,
      gridSpacing: (insertBot as any).gridSpacing ?? null,
      gridUpperBound: (insertBot as any).gridUpperBound ?? null,
      gridLowerBound: (insertBot as any).gridLowerBound ?? null,

      dcaOrderCount: (insertBot as any).dcaOrderCount ?? null,
      dcaStepPercent: (insertBot as any).dcaStepPercent ?? null,
      dcaVolumeScale: (insertBot as any).dcaVolumeScale ?? null,

      maxPositionSize: (insertBot as any).maxPositionSize ?? null,
      riskPerTrade: (insertBot as any).riskPerTrade ?? null,
      maxActiveOrders: (insertBot as any).maxActiveOrders ?? null,

      rsiPeriod: (insertBot as any).rsiPeriod ?? null,
      rsiOverbought: (insertBot as any).rsiOverbought ?? null,
      rsiOversold: (insertBot as any).rsiOversold ?? null,
      timeframe: (insertBot as any).timeframe ?? null,

      executionType: (insertBot as any).executionType ?? null,
      slippageTolerance: (insertBot as any).slippageTolerance ?? null,

      aiStrategy: (insertBot as any).aiStrategy ?? null,
      confidenceThreshold: (insertBot as any).confidenceThreshold ?? null,
      learningMode: (insertBot as any).learningMode ?? true,
      marketRegime: (insertBot as any).marketRegime ?? null,
      sentimentWeight: (insertBot as any).sentimentWeight ?? null,
      newsImpactThreshold: (insertBot as any).newsImpactThreshold ?? null,
      adaptationSpeed: (insertBot as any).adaptationSpeed ?? null,
      profitTargetMode: (insertBot as any).profitTargetMode ?? null,
      aiRiskMultiplier: (insertBot as any).aiRiskMultiplier ?? null,

      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    this.tradingBots.set(bot.id, bot);
    await this.saveTradingBots();
    return bot;
  }

  async getTradingBot(id: number): Promise<TradingBot | undefined> {
    return this.tradingBots.get(id);
  }

  async updateTradingBot(id: number, updates: Partial<TradingBot>): Promise<TradingBot | undefined> {
    const bot = this.tradingBots.get(id);
    if (!bot) return undefined;
    const next = { ...bot, ...updates, updatedAt: new Date() } as TradingBot;
    this.tradingBots.set(id, next);
    await this.saveTradingBots();
    return next;
  }

  async deleteTradingBot(id: number): Promise<boolean> {
    const ok = this.tradingBots.delete(id);
    if (ok) await this.saveTradingBots();
    return ok;
  }

  /* -------------------------------- Positions -------------------------------- */

  async getPositionsByUserId(userId: number): Promise<Position[]> {
    return [...this.positions.values()].filter((p) => p.userId === userId);
  }

  async getOpenPositionsByUserId(userId: number): Promise<Position[]> {
    return [...this.positions.values()].filter((p) => p.userId === userId && p.status === 'open');
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const pos: Position = {
      id: this.nextPositionId++,
      userId: insertPosition.userId,
      botId: insertPosition.botId ?? null,
      symbol: insertPosition.symbol,
      side: insertPosition.side,
      quantity: insertPosition.quantity,
      entryPrice: insertPosition.entryPrice,
      currentPrice: (insertPosition as any).currentPrice ?? null,
      pnl: (insertPosition as any).pnl ?? '0',
      status: insertPosition.status,
      openTime: (insertPosition as any).openTime ?? new Date(),
      closeTime: (insertPosition as any).closeTime ?? null,
    } as any;

    this.positions.set(pos.id, pos);
    await this.savePositions();
    return pos;
  }

  /* --------------------------------- API Keys -------------------------------- */

  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    return [...this.apiKeys.values()].filter((k) => k.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const key: ApiKey = {
      id: this.nextApiKeyId++,
      userId: insertApiKey.userId,
      exchange: insertApiKey.exchange,
      apiKey: insertApiKey.apiKey,
      secretKey: insertApiKey.secretKey,
      passphrase: (insertApiKey as any).passphrase ?? null,
      testnet: (insertApiKey as any).testnet ?? false,
      isActive: (insertApiKey as any).isActive ?? true,
      permissions: (insertApiKey as any).permissions ?? null,
      createdAt: new Date(),
    } as any;

    this.apiKeys.set(key.id, key);
    await this.saveApiKeys();
    return key;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const ok = this.apiKeys.delete(id);
    if (ok) await this.saveApiKeys();
    return ok;
  }

  /* ------------------------------- Order Alerts ------------------------------- */

  async getOrderAlertsByUserId(userId: number, limit?: number): Promise<OrderAlert[]> {
    const all = [...this.orderAlerts.values()].filter((a) => a.userId === userId);
    all.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    return typeof limit === 'number' ? all.slice(0, limit) : all;
  }

  async createOrderAlert(insertAlert: InsertOrderAlert): Promise<OrderAlert> {
    const alert: OrderAlert = {
      id: this.nextOrderAlertId++,
      userId: insertAlert.userId,
      botId: (insertAlert as any).botId ?? null,
      symbol: insertAlert.symbol,
      side: insertAlert.side,
      quantity: insertAlert.quantity,
      price: insertAlert.price,
      type: insertAlert.type,
      message: (insertAlert as any).message ?? null,
      createdAt: new Date(),
    } as any;

    this.orderAlerts.set(alert.id, alert);
    await this.saveOrderAlerts();
    return alert;
  }

  /* -------------------------------- Live Orders ------------------------------- */

  async getLiveOrdersByUserId(userId: number): Promise<LiveOrder[]> {
    return [...this.liveOrders.values()].filter((o) => o.userId === userId);
  }

  async createLiveOrder(insertOrder: InsertLiveOrder): Promise<LiveOrder> {
    const order: LiveOrder = {
      id: this.nextLiveOrderId++,
      userId: insertOrder.userId,
      exchangeOrderId: insertOrder.exchangeOrderId,
      exchange: insertOrder.exchange,
      symbol: insertOrder.symbol,
      side: insertOrder.side,
      type: insertOrder.type,
      quantity: insertOrder.quantity,
      price: (insertOrder as any).price ?? null,
      filledQuantity: (insertOrder as any).filledQuantity ?? '0',
      status: insertOrder.status,
      timeInForce: (insertOrder as any).timeInForce ?? 'GTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    this.liveOrders.set(order.id, order);
    await this.saveLiveOrders();
    return order;
  }

  async updateLiveOrder(id: number, updates: Partial<LiveOrder>): Promise<LiveOrder | undefined> {
    const existing = this.liveOrders.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...updates, updatedAt: new Date() } as LiveOrder;
    this.liveOrders.set(id, next);
    await this.saveLiveOrders();
    return next;
  }

  /* ------------------------------ Advanced Orders ----------------------------- */

  async getAdvancedOrdersByUserId(userId: number): Promise<AdvancedOrder[]> {
    return [...this.advancedOrders.values()].filter((o) => o.userId === userId);
  }

  async createAdvancedOrder(insertOrder: InsertAdvancedOrder): Promise<AdvancedOrder> {
    const order: AdvancedOrder = {
      id: this.nextAdvancedOrderId++,
      userId: insertOrder.userId,
      botId: (insertOrder as any).botId ?? null,
      symbol: insertOrder.symbol,
      exchange: insertOrder.exchange,
      type: insertOrder.type,
      status: insertOrder.status,

      ocoStopPrice: (insertOrder as any).ocoStopPrice ?? null,
      ocoLimitPrice: (insertOrder as any).ocoLimitPrice ?? null,
      ocoStopLimitPrice: (insertOrder as any).ocoStopLimitPrice ?? null,

      icebergQuantity: (insertOrder as any).icebergQuantity ?? null,
      icebergVisibleSize: (insertOrder as any).icebergVisibleSize ?? null,

      totalQuantity: insertOrder.totalQuantity,
      executedQuantity: (insertOrder as any).executedQuantity ?? '0',
      paperTrade: (insertOrder as any).paperTrade ?? false,
      createdAt: new Date(),
    } as any;

    this.advancedOrders.set(order.id, order);
    await this.saveAdvancedOrders();
    return order;
  }

  async deleteAdvancedOrder(id: number): Promise<boolean> {
    const ok = this.advancedOrders.delete(id);
    if (ok) await this.saveAdvancedOrders();
    return ok;
  }

  /* ------------------------------ Subscriptions ------------------------------- */

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    // One subscription per user (latest wins). If you later support multiple providers,
    // change this to filter by userId and pick the newest, or add getSubscriptionsByUserId.
    for (const sub of this.subscriptions.values()) {
      if (sub.userId === userId) return sub;
    }
    return undefined;
  }

  async createSubscription(insert: InsertSubscription): Promise<Subscription> {
    // If one-per-user, replace existing
    const existing = await this.getSubscriptionByUserId(insert.userId);
    if (existing) {
      // update existing instead
      const merged: Subscription = {
        ...existing,
        ...insert,
        id: existing.id,
        createdAt: existing.createdAt ?? new Date(),
        updatedAt: new Date(),
        lastVerified: (insert as any).lastVerified ?? new Date(),
      } as any;
      this.subscriptions.set(existing.id, merged);
      await this.saveSubscriptions();
      return merged;
    }

    const sub: Subscription = {
      id: this.nextSubscriptionId++,
      userId: insert.userId,
      provider: insert.provider,
      productId: insert.productId,
      purchaseToken: (insert as any).purchaseToken ?? null,
      purchaseId: (insert as any).purchaseId ?? null,
      isActive: (insert as any).isActive ?? false,
      expiryDate: (insert as any).expiryDate ?? null,
      lastVerified: (insert as any).lastVerified ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    this.subscriptions.set(sub.id, sub);
    await this.saveSubscriptions();
    return sub;
  }

  async updateSubscription(userId: number, update: SubscriptionUpdate & Partial<Subscription>): Promise<Subscription | undefined> {
    const existing = await this.getSubscriptionByUserId(userId);
    if (!existing) return undefined;
    const next: Subscription = {
      ...existing,
      ...update,
      updatedAt: new Date(),
      lastVerified: (update as any).lastVerified ?? new Date(),
    } as any;
    this.subscriptions.set(existing.id, next);
    await this.saveSubscriptions();
    return next;
  }

  /**
   * Returns a simplified status object used by the client:
   * { isActive, expiryDate?, productId?, provider?, lastVerified? }
   * Applies expiry check to flip isActive=false when past expiry.
   */
  async getUserSubscriptionStatus(userId: number): Promise<{
    isActive: boolean;
    expiryDate?: Date | null;
    productId?: string | null;
    provider?: 'huawei' | 'samsung' | 'web' | null;
    lastVerified?: Date | null;
  } | null> {
    const sub = await this.getSubscriptionByUserId(userId);
    if (!sub) return null;

    let isActive = !!sub.isActive;
    if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
      isActive = false;
    }

    return {
      isActive,
      expiryDate: (sub as any).expiryDate ?? null,
      productId: (sub as any).productId ?? null,
      provider: (sub as any).provider ?? null,
      lastVerified: (sub as any).lastVerified ?? null,
    };
  }

  /* ------------------------------- Market Data ------------------------------- */

  async getLatestMarketData(): Promise<MarketData[]> {
    return []; // live via exchange, not persisted here
  }

  async getTradeHistoryByUserId(_userId: number): Promise<any[]> {
    return []; // would be fetched from connected exchanges in real-time
  }
}

export const persistentStorage = new PersistentStorage();
console.log('Persistent file-based storage ready.');
