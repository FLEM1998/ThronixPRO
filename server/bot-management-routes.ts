import { Router, type Request, type Response } from "express";
import { advancedBotService } from "./advanced-bot-service";
import { storage } from "./storage";
import { db } from "./db";
import { aiBotLogs, strategyLibrary, botPerformanceAnalytics, tradingBots } from "@shared/schema";
import { eq, desc, and, count, avg, sum } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'thronix_secret_key_2025';

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const router = Router();

/**
 * Start an advanced AI trading bot
 */
router.post('/ai/bot/start', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { botId, symbol, riskLevel } = req.body;

    if (!botId || !symbol) {
      return res.status(400).json({ 
        error: 'Bot ID and symbol are required' 
      });
    }

    // Verify bot belongs to user
    const bot = await storage.getTradingBotById(botId);
    if (!bot || bot.userId !== userId) {
      return res.status(403).json({ 
        error: 'Bot not found or access denied' 
      });
    }

    const success = await advancedBotService.startAdvancedBot(
      userId, 
      botId, 
      symbol, 
      riskLevel || 'medium'
    );

    if (success) {
      res.json({ 
        status: 'success',
        message: `Advanced AI bot started for ${symbol}`,
        botId,
        riskLevel: riskLevel || 'medium'
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to start bot. Check if bot is already running or limit reached.' 
      });
    }
  } catch (error) {
    console.error('Bot start error:', error);
    res.status(500).json({ 
      error: 'Internal server error starting bot' 
    });
  }
});

/**
 * Stop an AI trading bot
 */
router.post('/ai/bot/stop', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { botId, symbol } = req.body;

    if (!botId || !symbol) {
      return res.status(400).json({ 
        error: 'Bot ID and symbol are required' 
      });
    }

    // Verify bot belongs to user
    const bot = await storage.getTradingBotById(botId);
    if (!bot || bot.userId !== userId) {
      return res.status(403).json({ 
        error: 'Bot not found or access denied' 
      });
    }

    const success = await advancedBotService.stopAdvancedBot(userId, botId, symbol);

    if (success) {
      res.json({ 
        status: 'success',
        message: `AI bot stopped for ${symbol}`,
        botId 
      });
    } else {
      res.status(400).json({ 
        error: 'Bot was not running or failed to stop' 
      });
    }
  } catch (error) {
    console.error('Bot stop error:', error);
    res.status(500).json({ 
      error: 'Internal server error stopping bot' 
    });
  }
});

/**
 * Get bot performance analytics
 */
router.get('/ai/bot/:botId/performance', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const botId = parseInt(req.params.botId);

    if (isNaN(botId)) {
      return res.status(400).json({ error: 'Invalid bot ID' });
    }

    // Verify bot belongs to user
    const bot = await storage.getTradingBotById(botId);
    if (!bot || bot.userId !== userId) {
      return res.status(403).json({ 
        error: 'Bot not found or access denied' 
      });
    }

    const performance = await advancedBotService.getBotPerformance(botId, userId);
    
    if (performance) {
      res.json({
        botId,
        performance,
        isActive: advancedBotService.getActiveBots().some(key => key.includes(`${botId}`))
      });
    } else {
      res.status(404).json({ error: 'Performance data not found' });
    }
  } catch (error) {
    console.error('Performance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get bot execution logs
 */
router.get('/ai/bot/:botId/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const botId = parseInt(req.params.botId);
    const limit = parseInt(req.query.limit as string) || 50;

    if (isNaN(botId)) {
      return res.status(400).json({ error: 'Invalid bot ID' });
    }

    // Verify bot belongs to user
    const bot = await storage.getTradingBotById(botId);
    if (!bot || bot.userId !== userId) {
      return res.status(403).json({ 
        error: 'Bot not found or access denied' 
      });
    }

    const logs = await db.select()
      .from(aiBotLogs)
      .where(and(eq(aiBotLogs.botId, botId), eq(aiBotLogs.userId, userId)))
      .orderBy(desc(aiBotLogs.timestamp))
      .limit(Math.min(limit, 100));

    res.json({
      botId,
      logs: logs.map(log => ({
        id: log.id,
        coin: log.coin,
        signal: log.signal,
        strategy: log.strategy,
        pnl: log.pnl,
        result: log.result,
        executionTime: log.executionTime,
        timestamp: log.timestamp
      })),
      totalLogs: logs.length
    });
  } catch (error) {
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get available trading strategies
 */
router.get('/ai/strategies', authenticate, async (req: Request, res: Response) => {
  try {
    const strategies = await db.select()
      .from(strategyLibrary)
      .where(eq(strategyLibrary.isActive, true))
      .orderBy(desc(strategyLibrary.winRate))
      .limit(20);

    res.json({
      strategies: strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        type: strategy.type,
        description: strategy.description,
        winRate: strategy.winRate,
        avgPnl: strategy.avgPnl,
        riskScore: strategy.riskScore,
        backtestResults: strategy.backtestResults
      }))
    });
  } catch (error) {
    console.error('Strategies fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all active bots for the user
 */
router.get('/ai/bots/active', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Get user's bots from database
    const userBots = await storage.getTradingBotsByUserId(userId);
    
    // Get currently active bot keys
    const activeBotKeys = advancedBotService.getActiveBots();
    
    const activeBots = userBots
      .filter(bot => activeBotKeys.some(key => key.includes(`${bot.id}`)))
      .map(bot => ({
        id: bot.id,
        name: bot.name,
        symbol: bot.symbol,
        currentStrategy: bot.currentStrategy,
        isActive: true,
        createdAt: bot.createdAt
      }));

    res.json({
      activeBots,
      totalActive: activeBots.length,
      maxConcurrent: 10
    });
  } catch (error) {
    console.error('Active bots fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get comprehensive bot analytics dashboard
 */
router.get('/ai/analytics/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Get user's bot performance summary
    const userBots = await storage.getTradingBotsByUserId(userId);
    const botIds = userBots.map(bot => bot.id);

    if (botIds.length === 0) {
      return res.json({
        totalBots: 0,
        activeBots: 0,
        totalTrades: 0,
        successRate: 0,
        totalPnl: 0,
        bestPerformingBot: null,
        recentActivity: []
      });
    }

    // Get aggregated performance data
    const performanceData = await db.select({
      totalTrades: count(aiBotLogs.id),
      successfulTrades: count(aiBotLogs.id), // Will need to filter by result in actual implementation
      totalPnl: sum(aiBotLogs.pnl),
      avgExecutionTime: avg(aiBotLogs.executionTime)
    })
    .from(aiBotLogs)
    .where(eq(aiBotLogs.userId, userId));

    // Get recent activity
    const recentActivity = await db.select()
      .from(aiBotLogs)
      .where(eq(aiBotLogs.userId, userId))
      .orderBy(desc(aiBotLogs.timestamp))
      .limit(10);

    const activeBotCount = advancedBotService.getActiveBots()
      .filter(key => key.startsWith(`${userId}_`)).length;

    res.json({
      totalBots: userBots.length,
      activeBots: activeBotCount,
      totalTrades: performanceData[0]?.totalTrades || 0,
      successRate: 0, // Calculate actual success rate
      totalPnl: performanceData[0]?.totalPnl || '0',
      avgExecutionTime: performanceData[0]?.avgExecutionTime || 0,
      recentActivity: recentActivity.map(activity => ({
        botId: activity.botId,
        coin: activity.coin,
        signal: activity.signal,
        result: activity.result,
        pnl: activity.pnl,
        timestamp: activity.timestamp
      }))
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Emergency stop all bots
 */
router.post('/ai/bots/emergency-stop', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await advancedBotService.stopAllBots();
    
    // Update all user's bots to inactive in database
    const userBots = await storage.getTradingBotsByUserId(userId);
    for (const bot of userBots) {
      await db.update(tradingBots)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(tradingBots.id, bot.id));
    }

    res.json({
      status: 'success',
      message: 'All bots stopped successfully',
      stoppedBots: userBots.length
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;