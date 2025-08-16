import { pgTable, text, serial, integer, boolean, decimal, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),

  // NEW: bind a single account to a device (nullable so web users without deviceId still work)
  deviceId: text("device_id").unique(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  verificationTokenIdx: index("verification_token_idx").on(table.verificationToken),
  passwordResetTokenIdx: index("password_reset_token_idx").on(table.passwordResetToken),

  // Optional explicit index (unique() already creates a unique constraint)
  deviceIdIdx: index("device_id_idx").on(table.deviceId),
}));

export const tradingBots = pgTable("trading_bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  strategy: text("strategy").notNull(),
  status: text("status").notNull(), // 'running', 'stopped', 'paused'
  exchange: text("exchange").notNull(), // 'binance', 'kucoin', 'bybit'
  quoteAmount: decimal("quote_amount", { precision: 10, scale: 2 }),
  pnl: decimal("pnl", { precision: 10, scale: 2 }).default("0"),
  
  // Advanced Trading Features
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }), // Stop loss price
  takeProfit: decimal("take_profit", { precision: 10, scale: 2 }), // Take profit price
  trailingStopPercent: decimal("trailing_stop_percent", { precision: 5, scale: 2 }), // Trailing stop %
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }), // Max drawdown %
  
  // Grid Trading Parameters
  gridLevels: integer("grid_levels"), // Number of grid levels
  gridSpacing: decimal("grid_spacing", { precision: 5, scale: 2 }), // Grid spacing %
  gridUpperBound: decimal("grid_upper_bound", { precision: 10, scale: 2 }),
  gridLowerBound: decimal("grid_lower_bound", { precision: 10, scale: 2 }),
  
  // DCA Parameters
  dcaOrderCount: integer("dca_order_count"), // Number of DCA orders
  dcaStepPercent: decimal("dca_step_percent", { precision: 5, scale: 2 }), // DCA step %
  dcaVolumeScale: decimal("dca_volume_scale", { precision: 3, scale: 2 }), // Volume scaling factor
  
  // Risk Management
  maxPositionSize: decimal("max_position_size", { precision: 18, scale: 8 }),
  riskPerTrade: decimal("risk_per_trade", { precision: 5, scale: 2 }), // Risk per trade %
  maxActiveOrders: integer("max_active_orders"),
  
  // Technical Analysis Parameters
  rsiPeriod: integer("rsi_period"),
  rsiOverbought: decimal("rsi_overbought", { precision: 5, scale: 2 }),
  rsiOversold: decimal("rsi_oversold", { precision: 5, scale: 2 }),
  timeframe: text("timeframe"), // '1m', '5m', '15m', '1h', '4h', '1d'
  
  // Execution Settings
  executionType: text("execution_type"), // 'market', 'limit', 'stop_limit'
  slippageTolerance: decimal("slippage_tolerance", { precision: 5, scale: 2 }),
  
  // AI Strategy Settings
  aiStrategy: text("ai_strategy"), // 'smart_trend', 'ml_predictor', 'neural_scalp', 'ai_momentum', 'sentiment_trader'
  confidenceThreshold: decimal("confidence_threshold", { precision: 5, scale: 2 }), // AI prediction confidence threshold (0.60-0.95)
  learningMode: boolean("learning_mode").default(true), // Enable ML model adaptation
  marketRegime: text("market_regime"), // 'trending', 'ranging', 'volatile', 'auto_detect'
  sentimentWeight: decimal("sentiment_weight", { precision: 3, scale: 2 }), // Weight for sentiment analysis (0.1-1.0)
  newsImpactThreshold: decimal("news_impact_threshold", { precision: 3, scale: 2 }), // Threshold for news impact trading
  adaptationSpeed: text("adaptation_speed"), // 'slow', 'medium', 'fast' - how quickly AI adapts to market changes
  profitTargetMode: text("profit_target_mode"), // 'conservative', 'balanced', 'aggressive'
  aiRiskMultiplier: decimal("ai_risk_multiplier", { precision: 3, scale: 2 }), // AI-based risk adjustment (0.5-2.0)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("trading_bots_user_id_idx").on(table.userId),
  statusIdx: index("trading_bots_status_idx").on(table.status),
  symbolIdx: index("trading_bots_symbol_idx").on(table.symbol),
  exchangeIdx: index("trading_bots_exchange_idx").on(table.exchange),
  strategyIdx: index("trading_bots_strategy_idx").on(table.strategy),
}));

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  botId: integer("bot_id").references(() => tradingBots.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'long', 'short'
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  pnl: decimal("pnl", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull(), // 'open', 'closed'
  openTime: timestamp("open_time").defaultNow().notNull(),
  closeTime: timestamp("close_time"),
}, (table) => ({
  userIdIdx: index("positions_user_id_idx").on(table.userId),
  botIdIdx: index("positions_bot_id_idx").on(table.botId),
  symbolIdx: index("positions_symbol_idx").on(table.symbol),
  statusIdx: index("positions_status_idx").on(table.status),
}));

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  exchange: text("exchange").notNull(), // 'binance', 'kucoin', 'bybit'
  apiKey: text("api_key").notNull(),
  secretKey: text("secret_key").notNull(),
  passphrase: text("passphrase"), // for KuCoin
  testnet: boolean("testnet").default(false),
  isActive: boolean("is_active").default(true),
  permissions: text("permissions").array(), // ['spot', 'futures', 'margin']
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("api_keys_user_id_idx").on(table.userId),
  exchangeIdx: index("api_keys_exchange_idx").on(table.exchange),
  isActiveIdx: index("api_keys_is_active_idx").on(table.isActive),
}));

export const orderAlerts = pgTable("order_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  botId: integer("bot_id"),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'BUY', 'SELL'
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'order', 'fill', 'stop_loss', 'take_profit'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveOrders = pgTable("live_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  exchangeOrderId: text("exchange_order_id").notNull(),
  exchange: text("exchange").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'BUY', 'SELL'
  type: text("type").notNull(), // 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  filledQuantity: decimal("filled_quantity", { precision: 18, scale: 8 }).default("0"),
  status: text("status").notNull(), // 'NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED'
  timeInForce: text("time_in_force").default("GTC"), // 'GTC', 'IOC', 'FOK'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  volume: decimal("volume", { precision: 18, scale: 8 }).notNull(),
  change24h: decimal("change_24h", { precision: 10, scale: 4 }).notNull(),
  high24h: decimal("high_24h", { precision: 18, scale: 8 }).notNull(),
  low24h: decimal("low_24h", { precision: 18, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Order Book Depth for real-time bid/ask spreads
export const orderBook = pgTable("order_book", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  side: text("side").notNull(), // 'bid' or 'ask'
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  total: decimal("total", { precision: 18, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Trade History for complete transaction logs
export const tradeHistory = pgTable("trade_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  botId: integer("bot_id"),
  orderId: text("order_id").notNull(),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  side: text("side").notNull(), // 'buy' or 'sell'
  type: text("type").notNull(), // 'market', 'limit', 'stop', 'oco', 'iceberg'
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }),
  feeCurrency: text("fee_currency"),
  realizedPnl: decimal("realized_pnl", { precision: 18, scale: 8 }),
  paperTrade: boolean("paper_trade").default(false),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Advanced Orders (OCO, Iceberg, etc.)
export const advancedOrders = pgTable("advanced_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  botId: integer("bot_id"),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  type: text("type").notNull(), // 'oco', 'iceberg', 'twap'
  status: text("status").notNull(), // 'pending', 'active', 'filled', 'cancelled'
  
  // OCO Order Parameters
  ocoStopPrice: decimal("oco_stop_price", { precision: 18, scale: 8 }),
  ocoLimitPrice: decimal("oco_limit_price", { precision: 18, scale: 8 }),
  ocoStopLimitPrice: decimal("oco_stop_limit_price", { precision: 18, scale: 8 }),
  
  // Iceberg Order Parameters
  icebergQuantity: decimal("iceberg_quantity", { precision: 18, scale: 8 }),
  icebergVisibleSize: decimal("iceberg_visible_size", { precision: 18, scale: 8 }),
  
  totalQuantity: decimal("total_quantity", { precision: 18, scale: 8 }).notNull(),
  executedQuantity: decimal("executed_quantity", { precision: 18, scale: 8 }).default("0"),
  paperTrade: boolean("paper_trade").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Portfolio Analytics for performance metrics
export const portfolioAnalytics = pgTable("portfolio_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).notNull(),
  dailyReturn: decimal("daily_return", { precision: 5, scale: 4 }),
  cumulativeReturn: decimal("cumulative_return", { precision: 5, scale: 4 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 4 }),
  volatility: decimal("volatility", { precision: 5, scale: 4 }),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  profitFactor: decimal("profit_factor", { precision: 5, scale: 2 }),
  paperTrade: boolean("paper_trade").default(false),
});

// Paper Trading Balances
export const paperTradingBalances = pgTable("paper_trading_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currency: text("currency").notNull(),
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0"),
  locked: decimal("locked", { precision: 18, scale: 8 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTradingBotSchema = createInsertSchema(tradingBots).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  openTime: true,
  closeTime: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertOrderAlertSchema = createInsertSchema(orderAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertLiveOrderSchema = createInsertSchema(liveOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  timestamp: true,
});

export const insertOrderBookSchema = createInsertSchema(orderBook).omit({
  id: true,
  timestamp: true,
});

export const insertTradeHistorySchema = createInsertSchema(tradeHistory).omit({
  id: true,
  executedAt: true,
});

export const insertAdvancedOrderSchema = createInsertSchema(advancedOrders).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioAnalyticsSchema = createInsertSchema(portfolioAnalytics).omit({
  id: true,
  date: true,
});

export const insertPaperTradingBalanceSchema = createInsertSchema(paperTradingBalances).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TradingBot = typeof tradingBots.$inferSelect;
export type InsertTradingBot = z.infer<typeof insertTradingBotSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type OrderAlert = typeof orderAlerts.$inferSelect;
export type InsertOrderAlert = z.infer<typeof insertOrderAlertSchema>;

export type LiveOrder = typeof liveOrders.$inferSelect;
export type InsertLiveOrder = z.infer<typeof insertLiveOrderSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

export type OrderBook = typeof orderBook.$inferSelect;
export type InsertOrderBook = z.infer<typeof insertOrderBookSchema>;

export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = z.infer<typeof insertTradeHistorySchema>;

export type AdvancedOrder = typeof advancedOrders.$inferSelect;
export type InsertAdvancedOrder = z.infer<typeof insertAdvancedOrderSchema>;

export type PortfolioAnalytics = typeof portfolioAnalytics.$inferSelect;
export type InsertPortfolioAnalytics = z.infer<typeof insertPortfolioAnalyticsSchema>;

export type PaperTradingBalance = typeof paperTradingBalances.$inferSelect;
export type InsertPaperTradingBalance = z.infer<typeof insertPaperTradingBalanceSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // NEW: allow optional device binding on login
  deviceId: z.string().min(1).optional(),
});

// Client-side registration schema (includes confirmPassword validation)
export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the legal disclaimer to register",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Server-side registration schema (no confirmPassword needed)
// NOTE: Accept only the fields we expect from the client during registration.
// Using insertUserSchema here would require fields like emailVerified and
// verification tokens that the client never sends, which caused validation
// errors in some environments. To avoid unwanted "Required" errors when
// registering a new user, explicitly define the schema for the fields we
// accept. Additional user properties (emailVerified, deviceId, etc.) are
// either set by the server or remain optional.
export const serverRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Device ID can be provided by mobile clients to bind a user to a device.
  deviceId: z.string().min(1).optional(),
  // Make termsAccepted optional on the server. The client still enforces the
  // legal disclaimer, but the server no longer throws a validation error
  // when this field is omitted. If present, it must be a boolean.
  termsAccepted: z.boolean().optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Subscription Management Schema
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // 'huawei', 'samsung', 'web'
  productId: text("product_id").notNull(),
  purchaseToken: text("purchase_token"),
  purchaseId: text("purchase_id"),
  isActive: boolean("is_active").default(false).notNull(),
  expiryDate: timestamp("expiry_date"),
  lastVerified: timestamp("last_verified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
  providerIdx: index("subscriptions_provider_idx").on(table.provider),
  activeIdx: index("subscriptions_active_idx").on(table.isActive),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SubscriptionUpdate = Partial<Pick<Subscription, 'isActive' | 'expiryDate' | 'lastVerified'>>;

// AI Bot Logs for performance tracking and strategy optimization
export const aiBotLogs = pgTable("ai_bot_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  botId: integer("bot_id").references(() => tradingBots.id),
  coin: text("coin").notNull(),
  strategy: text("strategy", { mode: 'json' }).$type<{
    type: string;
    parameters: Record<string, any>;
    confidence: number;
  }>(),
  signal: text("signal").notNull(), // 'buy', 'sell', 'hold'
  marketData: text("market_data", { mode: 'json' }).$type<{
    price: number;
    volume: number;
    rsi?: number;
    macd?: number;
    ema?: number;
    indicators: Record<string, number>;
  }>(),
  pnl: decimal("pnl", { precision: 18, scale: 8 }),
  result: text("result").notNull(), // 'success', 'failed', 'pending'
  executionTime: integer("execution_time"), // milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Advanced Strategy Library for AI bot optimization
export const strategyLibrary = pgTable("strategy_library", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'technical', 'ml', 'hybrid'
  description: text("description").notNull(),
  parameters: text("parameters", { mode: 'json' }).$type<Record<string, any>>(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  avgPnl: decimal("avg_pnl", { precision: 18, scale: 8 }),
  riskScore: decimal("risk_score", { precision: 3, scale: 2 }), // 0-10 scale
  backtestResults: text("backtest_results", { mode: 'json' }).$type<{
    totalTrades: number;
    winningTrades: number;
    totalReturn: number;
    maxDrawdown: number;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bot Performance Analytics for continuous optimization
export const botPerformanceAnalytics = pgTable("bot_performance_analytics", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull().references(() => tradingBots.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  totalTrades: integer("total_trades").default(0),
  successfulTrades: integer("successful_trades").default(0),
  totalPnl: decimal("total_pnl", { precision: 18, scale: 8 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  avgTradeTime: decimal("avg_trade_time", { precision: 10, scale: 2 }), // seconds
  riskAdjustedReturn: decimal("risk_adjusted_return", { precision: 5, scale: 4 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 4 }),
  currentStrategy: text("current_strategy"),
  adaptationCount: integer("adaptation_count").default(0), // how many times strategy adapted
});

// Insert schemas for new tables
export const insertAiBotLogSchema = createInsertSchema(aiBotLogs).omit({
  id: true,
  timestamp: true,
});

export const insertStrategyLibrarySchema = createInsertSchema(strategyLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotPerformanceAnalyticsSchema = createInsertSchema(botPerformanceAnalytics).omit({
  id: true,
  date: true,
});

// New types
export type AiBotLog = typeof aiBotLogs.$inferSelect;
export type InsertAiBotLog = z.infer<typeof insertAiBotLogSchema>;

export type StrategyLibrary = typeof strategyLibrary.$inferSelect;
export type InsertStrategyLibrary = z.infer<typeof insertStrategyLibrarySchema>;

export type BotPerformanceAnalytics = typeof botPerformanceAnalytics.$inferSelect;
export type InsertBotPerformanceAnalytics = z.infer<typeof insertBotPerformanceAnalyticsSchema>;
