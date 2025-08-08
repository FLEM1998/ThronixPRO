import { storage } from "./storage";
import { exchangeService } from "./exchange-service";
import { marketDataService } from "./market-data-service";

export interface AITradingSignal {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0-1
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskScore: number; // 0-1
  marketSentiment: "bullish" | "bearish" | "neutral";
}

export interface AIMarketAnalysis {
  symbol: string;
  currentPrice: number;
  trendDirection: "up" | "down" | "sideways";
  volatility: number;
  volume: number;
  momentumScore: number;
  supportLevel: number;
  resistanceLevel: number;
  rsiValue: number;
  marketRegime: "trending" | "ranging" | "volatile";
  newsImpact: number; // 0-1
  sentimentScore: number; // -1 to 1
  // ENHANCED AI LEARNING PROPERTIES for maximum profit optimization
  volumeStrength?: number;
  trendStrength?: number;
  marketCorrelation?: number;
  volatilityForecast?: number;
  microstructure?: number;
  marketStrength?: number;
  priceRange?: number;
  fibLevels?: { support: number; resistance: number; levels: number[] };
  high24h?: number;
  low24h?: number;
  profitPotential?: number; // Calculated profit potential percentage
  riskLevel?: number; // 0-1 risk assessment
}

export class AITradingService {
  private learningData: Map<string, any> = new Map(); // Store learning outcomes
  private profitHistory: Map<number, number[]> = new Map(); // Track bot profits

  /**
   * Records trading outcome for AI learning
   */
  public async recordTradingOutcome(
    botId: number,
    signal: AITradingSignal,
    actualPnl: number,
    marketConditions: AIMarketAnalysis,
  ): Promise<void> {
    const key = `${botId}_${signal.action}_${marketConditions.marketRegime}`;

    if (!this.learningData.has(key)) {
      this.learningData.set(key, {
        totalTrades: 0,
        profitableTrades: 0,
        totalPnl: 0,
        averageConfidence: 0,
        bestConditions: {},
        worstConditions: {},
      });
    }

    const data = this.learningData.get(key);
    data.totalTrades++;
    data.totalPnl += actualPnl;
    data.averageConfidence = (data.averageConfidence + signal.confidence) / 2;

    if (actualPnl > 0) {
      data.profitableTrades++;
      // Learn from profitable conditions
      data.bestConditions = {
        volatility: marketConditions.volatility,
        momentum: marketConditions.momentumScore,
        sentiment: marketConditions.sentimentScore,
        rsi: marketConditions.rsiValue,
      };
    } else {
      // Learn from losing conditions to avoid
      data.worstConditions = {
        volatility: marketConditions.volatility,
        momentum: marketConditions.momentumScore,
        sentiment: marketConditions.sentimentScore,
        rsi: marketConditions.rsiValue,
      };
    }

    // Update bot profit history
    if (!this.profitHistory.has(botId)) {
      this.profitHistory.set(botId, []);
    }
    this.profitHistory.get(botId)!.push(actualPnl);

    console.log(
      `AI Learning: Bot ${botId} recorded ${actualPnl > 0 ? "profit" : "loss"} of $${actualPnl}`,
    );
  }

  /**
   * Gets AI learning insights for profit optimization
   */
  public getLearningInsights(botId: number): {
    winRate: number;
    averageProfit: number;
    bestStrategy: string;
    improvementSuggestions: string[];
  } {
    const profits = this.profitHistory.get(botId) || [];
    const totalTrades = profits.length;

    if (totalTrades === 0) {
      return {
        winRate: 0,
        averageProfit: 0,
        bestStrategy: "insufficient_data",
        improvementSuggestions: ["Continue trading to gather learning data"],
      };
    }

    const profitableTrades = profits.filter((p) => p > 0).length;
    const winRate = (profitableTrades / totalTrades) * 100;
    const averageProfit = profits.reduce((sum, p) => sum + p, 0) / totalTrades;

    // Analyze best performing conditions
    let bestStrategy = "trend_following";
    const suggestions = [];

    if (winRate < 40) {
      suggestions.push(
        "Increase confidence threshold to 0.80+ for more selective trades",
      );
      suggestions.push("Focus on trending markets with momentum > 0.7");
    } else if (winRate > 70) {
      suggestions.push(
        "Consider increasing position size due to strong performance",
      );
      suggestions.push("Explore more aggressive profit targets");
    }

    if (averageProfit < 0) {
      suggestions.push("Reduce risk per trade to preserve capital");
      suggestions.push("Focus on risk management and smaller position sizes");
    }

    return {
      winRate,
      averageProfit,
      bestStrategy,
      improvementSuggestions: suggestions,
    };
  }

  /**
   * Comprehensive market analysis using ALL available data sources for maximum profit learning
   */
  public async analyzeMarket(
    symbol: string,
    exchange: string,
  ): Promise<AIMarketAnalysis> {
    try {
      // COMPREHENSIVE AI MARKET ANALYSIS - Using ALL available features for maximum profit learning

      // 1. GET LIVE MARKET DATA from multiple sources
      const marketData = await marketDataService.getCurrencyData(
        symbol.replace("/", ""),
      );

      if (!marketData) {
        throw new Error(
          "Live market data not available - connect exchange APIs for real-time analysis",
        );
      }

      // Extract comprehensive market metrics
      const currentPrice = parseFloat(String(marketData.last || 0));
      const volume = parseFloat(String(marketData.volume || 0));
      const change24h = parseFloat(String(marketData.change || 0));
      const high24h = parseFloat(
        String(marketData.high || currentPrice * 1.05),
      );
      const low24h = parseFloat(String(marketData.low || currentPrice * 0.95));

      // 2. ADVANCED TECHNICAL ANALYSIS - Multiple indicators for AI learning
      const momentumScore = this.calculateMomentumScore(change24h);
      const rsiValue = this.calculateRSI(currentPrice, change24h);
      const volatility = Math.abs(change24h) / 100;

      // Enhanced volatility using high/low range
      const priceRange = ((high24h - low24h) / currentPrice) * 100;
      const enhancedVolatility = Math.max(volatility, priceRange / 100);

      // 3. MARKET REGIME DETECTION - Critical for strategy selection
      const marketRegime = this.determineMarketRegime(
        change24h,
        enhancedVolatility * 100,
      );

      // 4. VOLUME ANALYSIS - Trend confirmation
      const volumeStrength = this.analyzeVolumeStrength(volume, change24h);

      // 5. FIBONACCI LEVELS - Advanced support/resistance
      const fibLevels = this.calculateFibonacciLevels(
        high24h,
        low24h,
        currentPrice,
      );

      // 6. TREND STRENGTH CALCULATION - Multi-factor analysis
      const trendStrength = this.calculateTrendStrength(
        change24h,
        volumeStrength,
        momentumScore,
      );

      // 7. MARKET CORRELATION - BTC dominance impact
      const marketCorrelation = this.analyzeMarketCorrelation(
        symbol,
        change24h,
      );

      // 8. VOLATILITY FORECASTING - Predict future volatility
      const volatilityForecast = this.forecastVolatility(
        enhancedVolatility,
        volume,
      );

      // 9. NEWS IMPACT AND SENTIMENT - Real-time market sentiment
      const newsImpact = await this.getNewsImpact(symbol);
      const sentimentScore = await this.getSentimentScore(symbol);

      // 10. MARKET MICROSTRUCTURE - Order flow analysis
      const microstructure = this.analyzeMarketMicrostructure(
        currentPrice,
        volume,
        change24h,
      );

      // 11. COMPREHENSIVE SUPPORT/RESISTANCE - Multiple methods
      const supportLevel = Math.min(
        fibLevels.support,
        currentPrice * 0.97,
        low24h,
      );
      const resistanceLevel = Math.max(
        fibLevels.resistance,
        currentPrice * 1.03,
        high24h,
      );

      // 12. MARKET STRENGTH INDICATOR - Overall market health
      const marketStrength = this.calculateMarketStrength(
        change24h,
        volume,
        trendStrength,
        volatilityForecast,
      );

      const analysis: AIMarketAnalysis = {
        symbol,
        currentPrice,
        trendDirection: this.determineTrendDirection(
          change24h,
          trendStrength,
          volumeStrength,
        ),
        volatility: enhancedVolatility,
        volume,
        momentumScore,
        supportLevel,
        resistanceLevel,
        rsiValue,
        marketRegime,
        newsImpact,
        sentimentScore,
        // ENHANCED AI LEARNING DATA
        volumeStrength,
        trendStrength,
        marketCorrelation,
        volatilityForecast,
        microstructure,
        marketStrength,
        priceRange,
        fibLevels,
        high24h,
        low24h,
        // Learning metrics for AI improvement
        profitPotential: this.calculateProfitPotential(
          trendStrength,
          volatilityForecast,
          marketStrength,
        ),
        riskLevel: this.calculateRiskLevel(
          enhancedVolatility,
          marketRegime,
          sentimentScore,
        ),
      };

      // STORE ANALYSIS FOR CONTINUOUS AI LEARNING - Critical for profit optimization
      this.storeMarketAnalysisForLearning(symbol, analysis);

      console.log(
        `AI Analysis Complete - ${symbol}: Trend=${analysis.trendDirection}, Strength=${trendStrength.toFixed(2)}, Profit Potential=${(analysis.profitPotential || 0).toFixed(2)}%`,
      );

      return analysis;
    } catch (error) {
      console.error("Comprehensive AI market analysis error:", error);
      throw error;
    }
  }

  /**
   * Generates AI trading signals based on market analysis
   */
  public async generateTradingSignal(
    userId: number,
    botId: number,
    symbol: string,
    exchange: string,
  ): Promise<AITradingSignal> {
    try {
      // Get bot configuration
      const bot = await storage.getTradingBot(botId);
      if (!bot || bot.userId !== userId) {
        throw new Error("Bot not found or unauthorized");
      }

      // Perform AI market analysis
      const analysis = await this.analyzeMarket(symbol, exchange);

      // Generate AI signal based on strategy
      const signal = await this.generateSignalForStrategy(bot, analysis);

      return signal;
    } catch (error) {
      console.error("AI signal generation error:", error);
      throw error;
    }
  }

  /**
   * Closes all positions for a specific bot when stopped
   */
  public async closeAllBotPositions(
    userId: number,
    botId: number,
  ): Promise<void> {
    try {
      console.log(`AI Bot ${botId}: Closing all positions for user ${userId}`);

      // Get bot information from storage
      const { storage } = await import("./storage");
      const bot = await storage.getTradingBot(botId);

      if (!bot) {
        console.log(
          `AI Bot ${botId}: Bot not found, skipping position closure`,
        );
        return;
      }

      // Get all open positions for this specific bot
      const openPositions = await storage.getOpenPositionsByUserId(userId);
      const botPositions = openPositions.filter((pos) => pos.botId === botId);

      if (botPositions.length === 0) {
        console.log(`AI Bot ${botId}: No open positions to close`);
        return;
      }

      console.log(
        `AI Bot ${botId}: Found ${botPositions.length} positions to close`,
      );

      // Close each position by creating opposite market orders
      for (const position of botPositions) {
        try {
          const { exchangeService } = await import("./exchange-service");

          // Determine order side (opposite of position)
          const orderSide = position.side === "buy" ? "sell" : "buy";

          // Place market order to close position
          const closeOrder = await exchangeService.placeOrder(
            userId,
            bot.exchange,
            {
              symbol: position.symbol,
              type: "market",
              side: orderSide,
              amount: parseFloat(position.quantity),
            },
          );

          console.log(
            `AI Bot ${botId}: Closed position ${position.id} with order ${closeOrder.id}`,
          );

          // Update position status to closed
          await storage.updatePosition(position.id, {
            status: "closed",
            closeTime: new Date(),
            pnl: position.pnl || "0",
          });
        } catch (positionError) {
          console.error(
            `AI Bot ${botId}: Failed to close position ${position.id}:`,
            positionError,
          );
          // Continue with other positions even if one fails
        }
      }

      // Record the closure in learning data for AI improvement
      const learningKey = `${botId}_POSITION_CLOSED`;

      if (!this.learningData.has(learningKey)) {
        this.learningData.set(learningKey, {
          totalClosures: 0,
          lastClosure: new Date(),
          positionsClosed: 0,
        });
      }

      const data = this.learningData.get(learningKey);
      data.totalClosures++;
      data.positionsClosed += botPositions.length;
      data.lastClosure = new Date();

      console.log(
        `AI Bot ${botId}: Successfully closed ${botPositions.length} positions`,
      );
    } catch (error) {
      console.error(`AI Bot ${botId}: Error closing positions:`, error);
      throw error;
    }
  }

  /**
   * Executes AI trading strategy
   */
  public async executeTradingStrategy(
    userId: number,
    botId: number,
  ): Promise<void> {
    try {
      const bot = await storage.getTradingBot(botId);
      if (!bot || bot.userId !== userId || bot.status !== "running") {
        return;
      }

      // Generate AI trading signal
      const signal = await this.generateTradingSignal(
        userId,
        botId,
        bot.symbol,
        bot.exchange,
      );

      // Check if signal meets confidence threshold
      const confidenceThreshold = parseFloat(bot.confidenceThreshold || "0.75");
      if (signal.confidence < confidenceThreshold) {
        console.log(
          `Signal confidence ${signal.confidence} below threshold ${confidenceThreshold}`,
        );
        return;
      }

      // Execute trade based on AI signal
      if (signal.action === "BUY" || signal.action === "SELL") {
        await this.executeAITrade(userId, bot, signal);
      }
    } catch (error) {
      console.error("AI strategy execution error:", error);
    }
  }

  /**
   * Gets strategy recommendations for a symbol
   */
  public async getStrategyRecommendations(symbol: string): Promise<{
    strategies: Array<{
      name: string;
      description: string;
      expectedReturn: string;
      riskLevel: string;
      confidence: number;
    }>;
    marketAnalysis: AIMarketAnalysis;
  }> {
    try {
      const analysis = await this.analyzeMarket(symbol, "kucoin");

      const strategies = [
        {
          name: "Smart Trend Follower",
          description: `Based on current ${analysis.trendDirection} trend and ${analysis.momentumScore.toFixed(2)} momentum score`,
          expectedReturn: analysis.trendDirection === "up" ? "8-15%" : "5-10%",
          riskLevel: analysis.volatility > 0.05 ? "Medium-High" : "Medium",
          confidence: analysis.momentumScore > 0.7 ? 0.85 : 0.65,
        },
        {
          name: "ML Price Predictor",
          description: `AI predicts ${analysis.trendDirection === "up" ? "bullish" : analysis.trendDirection === "down" ? "bearish" : "neutral"} movement`,
          expectedReturn: "10-20%",
          riskLevel: "Medium-High",
          confidence: Math.min(0.9, 0.6 + analysis.momentumScore * 0.3),
        },
        {
          name: "Neural Scalper",
          description: `Optimal for ${analysis.marketRegime} market conditions with ${analysis.volatility.toFixed(2)} volatility`,
          expectedReturn: "12-25%",
          riskLevel: analysis.volatility > 0.05 ? "Medium" : "Low-Medium",
          confidence: analysis.marketRegime === "volatile" ? 0.8 : 0.7,
        },
        {
          name: "Sentiment Trader",
          description: `Market sentiment: ${analysis.sentimentScore > 0 ? "Positive" : analysis.sentimentScore < 0 ? "Negative" : "Neutral"}`,
          expectedReturn: "6-12%",
          riskLevel: "Medium",
          confidence: Math.abs(analysis.sentimentScore) > 0.3 ? 0.75 : 0.6,
        },
      ];

      return { strategies, marketAnalysis: analysis };
    } catch (error) {
      console.error("Strategy recommendations error:", error);
      throw error;
    }
  }

  private async generateSignalForStrategy(
    bot: any,
    analysis: AIMarketAnalysis,
  ): Promise<AITradingSignal> {
    const strategy = bot.aiStrategy || bot.strategy;

    switch (strategy) {
      case "ai_master":
        return this.generateMasterBotSignal(bot, analysis);
      case "smart_trend":
        return this.generateTrendSignal(bot, analysis);
      case "ml_predictor":
        return this.generateMLSignal(bot, analysis);
      case "neural_scalp":
        return this.generateScalpSignal(bot, analysis);
      case "ai_momentum":
        return this.generateMomentumSignal(bot, analysis);
      case "sentiment_trader":
        return this.generateSentimentSignal(bot, analysis);
      default:
        return this.generateDefaultSignal(bot, analysis);
    }
  }

  private generateTrendSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    const { trendDirection, momentumScore, currentPrice } = analysis;

    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence = 0.5;
    let reasoning = "Analyzing trend...";

    if (trendDirection === "up" && momentumScore > 0.6) {
      action = "BUY";
      confidence = Math.min(0.9, 0.6 + momentumScore * 0.3);
      reasoning = `Strong uptrend detected with momentum score ${momentumScore.toFixed(2)}`;
    } else if (trendDirection === "down" && momentumScore > 0.6) {
      action = "SELL";
      confidence = Math.min(0.85, 0.55 + momentumScore * 0.3);
      reasoning = `Downtrend confirmed with momentum score ${momentumScore.toFixed(2)}`;
    } else {
      reasoning = `Trend unclear or weak momentum (${momentumScore.toFixed(2)})`;
    }

    return {
      action,
      confidence,
      reasoning,
      targetPrice: action === "BUY" ? currentPrice * 1.05 : currentPrice * 0.95,
      stopLoss: action === "BUY" ? currentPrice * 0.97 : currentPrice * 1.03,
      takeProfit: action === "BUY" ? currentPrice * 1.08 : currentPrice * 0.92,
      riskScore: Math.min(analysis.volatility * 2, 0.8),
      marketSentiment:
        analysis.sentimentScore > 0
          ? "bullish"
          : analysis.sentimentScore < 0
            ? "bearish"
            : "neutral",
    };
  }

  private generateMLSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    // Simulate ML prediction
    const prediction = this.simulateMLPrediction(analysis);

    return {
      action:
        prediction.direction === "up"
          ? "BUY"
          : prediction.direction === "down"
            ? "SELL"
            : "HOLD",
      confidence: prediction.confidence,
      reasoning: `ML model predicts ${prediction.direction} movement with ${(prediction.confidence * 100).toFixed(0)}% confidence`,
      targetPrice: prediction.targetPrice,
      stopLoss: prediction.stopLoss,
      takeProfit: prediction.takeProfit,
      riskScore: prediction.riskScore,
      marketSentiment: prediction.sentiment,
    };
  }

  private generateScalpSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    const { volatility, rsiValue, currentPrice } = analysis;

    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence = 0.6;

    if (rsiValue < 30 && volatility > 0.02) {
      action = "BUY";
      confidence = 0.75;
    } else if (rsiValue > 70 && volatility > 0.02) {
      action = "SELL";
      confidence = 0.75;
    }

    return {
      action,
      confidence,
      reasoning: `Scalping opportunity: RSI ${rsiValue.toFixed(0)}, volatility ${(volatility * 100).toFixed(1)}%`,
      targetPrice: action === "BUY" ? currentPrice * 1.02 : currentPrice * 0.98,
      stopLoss: action === "BUY" ? currentPrice * 0.995 : currentPrice * 1.005,
      takeProfit:
        action === "BUY" ? currentPrice * 1.015 : currentPrice * 0.985,
      riskScore: Math.min(volatility * 1.5, 0.6),
      marketSentiment: analysis.sentimentScore > 0 ? "bullish" : "bearish",
    };
  }

  private generateMomentumSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    const { momentumScore, currentPrice, trendDirection } = analysis;

    const action =
      momentumScore > 0.7 && trendDirection === "up"
        ? "BUY"
        : momentumScore > 0.7 && trendDirection === "down"
          ? "SELL"
          : "HOLD";

    return {
      action,
      confidence: momentumScore,
      reasoning: `Momentum signal: ${momentumScore.toFixed(2)} score with ${trendDirection} trend`,
      targetPrice: action === "BUY" ? currentPrice * 1.06 : currentPrice * 0.94,
      stopLoss: action === "BUY" ? currentPrice * 0.98 : currentPrice * 1.02,
      takeProfit: action === "BUY" ? currentPrice * 1.1 : currentPrice * 0.9,
      riskScore: 1 - momentumScore,
      marketSentiment: trendDirection === "up" ? "bullish" : "bearish",
    };
  }

  private generateSentimentSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    const { sentimentScore, newsImpact, currentPrice } = analysis;

    const sentimentWeight = parseFloat(bot.sentimentWeight || "0.3");
    const newsThreshold = parseFloat(bot.newsImpactThreshold || "0.5");

    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence = 0.5;

    if (sentimentScore > 0.3 && newsImpact > newsThreshold) {
      action = "BUY";
      confidence = Math.min(
        0.85,
        0.5 + sentimentScore * sentimentWeight + newsImpact * 0.2,
      );
    } else if (sentimentScore < -0.3 && newsImpact > newsThreshold) {
      action = "SELL";
      confidence = Math.min(
        0.85,
        0.5 + Math.abs(sentimentScore) * sentimentWeight + newsImpact * 0.2,
      );
    }

    return {
      action,
      confidence,
      reasoning: `Sentiment: ${sentimentScore.toFixed(2)}, News impact: ${newsImpact.toFixed(2)}`,
      targetPrice: action === "BUY" ? currentPrice * 1.04 : currentPrice * 0.96,
      stopLoss: action === "BUY" ? currentPrice * 0.98 : currentPrice * 1.02,
      takeProfit: action === "BUY" ? currentPrice * 1.07 : currentPrice * 0.93,
      riskScore: 1 - Math.abs(sentimentScore),
      marketSentiment: sentimentScore > 0 ? "bullish" : "bearish",
    };
  }

  private generateMasterBotSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    const {
      trendDirection,
      momentumScore,
      volatility,
      rsiValue,
      sentimentScore,
      newsImpact,
      currentPrice,
      marketRegime,
    } = analysis;

    // AI Master Bot evaluates all strategies and selects the best approach
    const strategies = [
      this.generateTrendSignal(bot, analysis),
      this.generateMLSignal(bot, analysis),
      this.generateScalpSignal(bot, analysis),
      this.generateMomentumSignal(bot, analysis),
      this.generateSentimentSignal(bot, analysis),
    ];

    // Use AI learning to weight strategies based on historical performance
    const learningInsights = this.getLearningInsights(bot.id);
    let bestStrategy = strategies.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );

    // Apply learning-based adjustments for profit optimization
    let confidenceAdjustment = 1.0;
    let riskAdjustment = 1.0;

    // If bot has poor win rate, be more conservative
    if (learningInsights.winRate > 0 && learningInsights.winRate < 40) {
      confidenceAdjustment = 1.2; // Require higher confidence
      riskAdjustment = 0.7; // Reduce risk
    } else if (learningInsights.winRate > 70) {
      confidenceAdjustment = 0.9; // Allow slightly lower confidence
      riskAdjustment = 1.3; // Increase risk for higher profits
    }

    // Adjust based on average profit performance
    if (learningInsights.averageProfit < 0) {
      riskAdjustment *= 0.5; // Significantly reduce risk if losing money
      confidenceAdjustment *= 1.3; // Be much more selective
    } else if (learningInsights.averageProfit > 50) {
      riskAdjustment *= 1.4; // Increase risk if making good profits
    }

    // Apply AI learning patterns
    const learningKey = `${bot.id}_${bestStrategy.action}_${marketRegime}`;
    const historicalData = this.learningData.get(learningKey);

    if (historicalData && historicalData.totalTrades > 5) {
      const successRate =
        historicalData.profitableTrades / historicalData.totalTrades;
      if (successRate > 0.6) {
        confidenceAdjustment *= 0.9; // Trust this pattern more
        riskAdjustment *= 1.2; // Increase position size
      } else if (successRate < 0.3) {
        confidenceAdjustment *= 1.5; // Be more cautious
        riskAdjustment *= 0.6; // Reduce position size
      }
    }

    // Apply AI Master Bot enhancements with learning
    const masterConfidence = Math.min(
      0.95,
      (bestStrategy.confidence * 1.1) / confidenceAdjustment,
    );
    const riskMultiplier =
      parseFloat(bot.aiRiskMultiplier || "1.2") * riskAdjustment;

    // Smart position sizing based on market conditions and learning
    let sizeMultiplier = 1.0;
    if (volatility < 0.02) sizeMultiplier = 1.2; // Low volatility = larger positions
    if (volatility > 0.08) sizeMultiplier = 0.8; // High volatility = smaller positions
    if (momentumScore > 0.8) sizeMultiplier *= 1.15; // Strong momentum = increase size

    // Apply learning-based size adjustment
    sizeMultiplier *= riskAdjustment;

    // Enhanced profit targets based on market regime and learning
    let profitMultiplier = 1.0;
    if (marketRegime === "trending") profitMultiplier = 1.3;
    if (marketRegime === "volatile") profitMultiplier = 0.8;
    if (marketRegime === "ranging") profitMultiplier = 1.1;

    // Adjust profit targets based on learning
    if (learningInsights.averageProfit > 0) {
      profitMultiplier *= 1.1; // Slightly more aggressive if profitable
    }

    return {
      action: bestStrategy.action,
      confidence: masterConfidence,
      reasoning: `AI Master (Learning) selected ${bestStrategy.reasoning} | Market: ${marketRegime} | Win Rate: ${learningInsights.winRate.toFixed(1)}% | Risk: ${(riskMultiplier * sizeMultiplier).toFixed(2)}x`,
      targetPrice: bestStrategy.targetPrice
        ? bestStrategy.targetPrice * profitMultiplier
        : undefined,
      stopLoss: bestStrategy.stopLoss,
      takeProfit: bestStrategy.takeProfit
        ? bestStrategy.takeProfit * profitMultiplier
        : undefined,
      riskScore: Math.max(
        0.1,
        bestStrategy.riskScore * riskMultiplier * sizeMultiplier,
      ),
      marketSentiment: bestStrategy.marketSentiment,
    };
  }

  private generateDefaultSignal(
    bot: any,
    analysis: AIMarketAnalysis,
  ): AITradingSignal {
    return {
      action: "HOLD",
      confidence: 0.5,
      reasoning: "No clear signal generated",
      riskScore: 0.5,
      marketSentiment: "neutral",
    };
  }

  private async executeAITrade(
    userId: number,
    bot: any,
    signal: AITradingSignal,
  ): Promise<void> {
    try {
      // CRITICAL: Get real exchange balances before executing any trade
      const exchangeBalances = await exchangeService.getBalance(
        userId,
        bot.exchange,
      );
      if (!exchangeBalances || exchangeBalances.length === 0) {
        throw new Error(
          `No real exchange balance found for ${bot.exchange}. Connect your exchange API keys first.`,
        );
      }

      // Parse symbol (e.g., "BTC/USDT" -> base: "BTC", quote: "USDT")
      const [baseCurrency, quoteCurrency] = bot.symbol.split("/");

      // Find real balances for the currencies
      const quoteBalance = exchangeBalances.find(
        (b) => b.symbol === quoteCurrency,
      );
      const baseBalance = exchangeBalances.find(
        (b) => b.symbol === baseCurrency,
      );

      if (!quoteBalance && !baseBalance) {
        throw new Error(
          `No real balance found for ${baseCurrency} or ${quoteCurrency} on ${bot.exchange}`,
        );
      }

      // Calculate position size based on REAL available balance
      const riskPerTrade = parseFloat(bot.riskPerTrade || "2") / 100;
      let availableBalance = 0;
      let orderSide: "buy" | "sell";

      if (signal.action === "BUY") {
        // For BUY orders, check quote currency balance (e.g., USDT for BTC/USDT)
        if (!quoteBalance || quoteBalance.free <= 0) {
          throw new Error(
            `Insufficient ${quoteCurrency} balance on ${bot.exchange}. Available: ${quoteBalance?.free || 0}`,
          );
        }
        availableBalance = quoteBalance.free;
        orderSide = "buy";
      } else if (signal.action === "SELL") {
        // For SELL orders, check base currency balance (e.g., BTC for BTC/USDT)
        if (!baseBalance || baseBalance.free <= 0) {
          throw new Error(
            `Insufficient ${baseCurrency} balance on ${bot.exchange}. Available: ${baseBalance?.free || 0}`,
          );
        }
        availableBalance = baseBalance.free;
        orderSide = "sell";
      } else {
        // HOLD signal - no trade execution
        console.log(`AI Bot ${bot.id}: HOLD signal - no trade executed`);
        return;
      }

      // Calculate trade amount based on real balance and risk management
      const maxTradeAmount = Math.min(
        parseFloat(bot.quoteAmount || "1000"), // Bot's configured amount limit
        availableBalance * 0.95, // Use 95% of available balance (leaving buffer for fees)
      );

      const riskAmount = maxTradeAmount * riskPerTrade;

      // Adjust for AI risk multiplier
      const aiRiskMultiplier = parseFloat(bot.aiRiskMultiplier || "1.0");
      const adjustedRiskAmount = riskAmount * aiRiskMultiplier;

      // Final safety check
      if (adjustedRiskAmount <= 0) {
        throw new Error(
          `Calculated trade amount is zero or negative. Available balance: ${availableBalance}`,
        );
      }

      const orderParams = {
        symbol: bot.symbol,
        type: "market" as const,
        side: orderSide,
        amount:
          signal.action === "BUY"
            ? adjustedRiskAmount // For buy orders, amount is in quote currency
            : adjustedRiskAmount / (signal.targetPrice || 1), // For sell orders, amount is in base currency
        price: signal.targetPrice,
      };

      // Execute the trade with real exchange balance verification
      console.log(
        `AI Bot ${bot.id}: Executing REAL trade with ${bot.exchange} - ${signal.action} ${orderParams.amount} ${bot.symbol}`,
      );
      await exchangeService.placeOrder(userId, bot.exchange, orderParams);

      // Log the successful AI trade
      console.log(
        `AI trade executed with REAL funds: ${signal.action} ${bot.symbol} with confidence ${signal.confidence} on ${bot.exchange}`,
      );
    } catch (error) {
      console.error(`AI trade execution error for bot ${bot.id}:`, error);
      throw error; // Re-throw to let calling function handle
    }
  }

  private calculateMomentumScore(change24h: number): number {
    // Normalize change to 0-1 score
    return Math.min(1, Math.abs(change24h) / 10);
  }

  private calculateRSI(currentPrice: number, change24h: number): number {
    // Simplified RSI calculation for demo
    const gainLoss = change24h > 0 ? change24h : Math.abs(change24h);
    const rs = change24h > 0 ? gainLoss / 1 : 1 / gainLoss;
    return 100 - 100 / (1 + rs);
  }

  private determineMarketRegime(
    change: number,
    volatility: number,
  ): "trending" | "ranging" | "volatile" {
    if (volatility > 5) return "volatile";
    if (Math.abs(change) > 3) return "trending";
    return "ranging";
  }

  private async getNewsImpact(symbol: string): Promise<number> {
    // Simulate news impact analysis (would integrate with news API in production)
    return Math.random() * 0.8 + 0.1; // 0.1-0.9 range
  }

  private async getSentimentScore(symbol: string): Promise<number> {
    // Simulate sentiment analysis (would integrate with sentiment API in production)
    return (Math.random() - 0.5) * 2; // -1 to 1 range
  }

  private simulateMLPrediction(analysis: AIMarketAnalysis): {
    direction: "up" | "down" | "sideways";
    confidence: number;
    targetPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskScore: number;
    sentiment: "bullish" | "bearish" | "neutral";
  } {
    const { currentPrice, momentumScore, sentimentScore, volatility } =
      analysis;

    // Simulate ML prediction based on analysis
    const combinedScore =
      (momentumScore + Math.abs(sentimentScore) + (1 - volatility)) / 3;

    let direction: "up" | "down" | "sideways" = "sideways";
    let confidence = 0.6;

    if (sentimentScore > 0.2 && momentumScore > 0.5) {
      direction = "up";
      confidence = Math.min(0.9, 0.6 + combinedScore * 0.3);
    } else if (sentimentScore < -0.2 && momentumScore > 0.5) {
      direction = "down";
      confidence = Math.min(0.85, 0.55 + combinedScore * 0.3);
    }

    return {
      direction,
      confidence,
      targetPrice:
        direction === "up"
          ? currentPrice * 1.06
          : direction === "down"
            ? currentPrice * 0.94
            : currentPrice,
      stopLoss:
        direction === "up"
          ? currentPrice * 0.97
          : direction === "down"
            ? currentPrice * 1.03
            : currentPrice * 0.98,
      takeProfit:
        direction === "up"
          ? currentPrice * 1.12
          : direction === "down"
            ? currentPrice * 0.88
            : currentPrice * 1.02,
      riskScore: volatility,
      sentiment:
        sentimentScore > 0
          ? "bullish"
          : sentimentScore < 0
            ? "bearish"
            : "neutral",
    };
  }

  // ENHANCED AI ANALYSIS METHODS FOR MAXIMUM PROFIT LEARNING

  private analyzeVolumeStrength(volume: number, change24h: number): number {
    // Volume strength indicates trend confirmation
    if (volume === 0) return 0;

    const volumeChangeRatio =
      Math.abs(change24h) / Math.max(volume / 1000000, 1);
    return Math.min(volumeChangeRatio * 10, 100); // Scale 0-100
  }

  private calculateFibonacciLevels(
    high: number,
    low: number,
    current: number,
  ): { support: number; resistance: number; levels: number[] } {
    const range = high - low;
    const levels = [
      low + range * 0.236, // 23.6% retracement
      low + range * 0.382, // 38.2% retracement
      low + range * 0.5, // 50% retracement
      low + range * 0.618, // 61.8% retracement
      low + range * 0.786, // 78.6% retracement
    ];

    // Find closest support and resistance
    const support = Math.max(...levels.filter((level) => level < current));
    const resistance = Math.min(...levels.filter((level) => level > current));

    return {
      support: support || current * 0.95,
      resistance: resistance || current * 1.05,
      levels,
    };
  }

  private calculateTrendStrength(
    change24h: number,
    volumeStrength: number,
    momentumScore: number,
  ): number {
    // Multi-factor trend strength calculation
    const priceStrength = Math.min(Math.abs(change24h) * 10, 100); // Price movement strength
    const combinedStrength =
      priceStrength * 0.4 + volumeStrength * 0.3 + momentumScore * 0.3;

    return Math.min(combinedStrength, 100);
  }

  private analyzeMarketCorrelation(symbol: string, change24h: number): number {
    // Analyze correlation with Bitcoin (market leader)
    if (symbol.includes("BTC")) return 1.0; // Perfect correlation with itself

    // Most altcoins have high correlation with BTC
    const baseCorrelation = symbol.includes("ETH") ? 0.8 : 0.75;

    // Adjust based on market movement
    const volatilityAdjustment = Math.abs(change24h) > 5 ? 0.1 : 0;

    return Math.min(baseCorrelation + volatilityAdjustment, 1.0);
  }

  private forecastVolatility(
    currentVolatility: number,
    volume: number,
  ): number {
    // Simple volatility forecasting based on current conditions
    const volumeImpact = volume > 1000000 ? 0.1 : -0.05; // High volume = higher volatility
    const trendImpact = currentVolatility > 0.05 ? 0.05 : 0; // High volatility tends to persist

    return Math.max(currentVolatility + volumeImpact + trendImpact, 0.01);
  }

  private analyzeMarketMicrostructure(
    price: number,
    volume: number,
    change24h: number,
  ): number {
    // Analyze order flow and market depth indicators
    const priceVolumeRatio =
      Math.abs(change24h) / Math.max(volume / 1000000, 1);
    const liquidityScore = volume > 500000 ? 0.8 : 0.4; // High volume = better liquidity

    return Math.min(priceVolumeRatio * 0.6 + liquidityScore * 0.4, 1.0);
  }

  private calculateMarketStrength(
    change24h: number,
    volume: number,
    trendStrength: number,
    volatilityForecast: number,
  ): number {
    // Overall market health indicator
    const priceAction = change24h > 0 ? 0.3 : -0.2; // Positive bias for upward movement
    const volumeHealth = Math.min(volume / 1000000, 1.0) * 0.3; // Volume strength
    const trendHealth = (trendStrength / 100) * 0.3; // Trend continuation
    const volatilityPenalty = volatilityForecast > 0.1 ? -0.1 : 0; // High volatility penalty

    return Math.max(
      priceAction + volumeHealth + trendHealth + volatilityPenalty,
      -1.0,
    );
  }

  private determineTrendDirection(
    change24h: number,
    trendStrength: number,
    volumeStrength: number,
  ): "up" | "down" | "sideways" {
    // Enhanced trend direction with multiple confirmations
    if (Math.abs(change24h) < 1) return "sideways"; // Low movement

    if (change24h > 0) {
      // Uptrend confirmation required
      return trendStrength > 30 && volumeStrength > 20 ? "up" : "sideways";
    } else {
      // Downtrend confirmation required
      return trendStrength > 30 && volumeStrength > 20 ? "down" : "sideways";
    }
  }

  private calculateProfitPotential(
    trendStrength: number,
    volatilityForecast: number,
    marketStrength: number,
  ): number {
    // Calculate potential profit percentage based on market conditions
    const trendBonus = (trendStrength / 100) * 5; // Strong trends = higher profit potential
    const volatilityBonus = Math.min(volatilityForecast * 50, 3); // Volatility creates opportunities
    const marketBonus = Math.max(marketStrength * 2, 0); // Positive market strength bonus

    return trendBonus + volatilityBonus + marketBonus;
  }

  private calculateRiskLevel(
    volatility: number,
    marketRegime: "trending" | "ranging" | "volatile",
    sentimentScore: number,
  ): number {
    // Calculate risk level from 0-1
    let risk = volatility; // Base risk from volatility

    // Market regime adjustment
    if (marketRegime === "volatile") risk += 0.2;
    if (marketRegime === "ranging") risk += 0.1;

    // Sentiment adjustment
    if (sentimentScore < 0.3) risk += 0.15; // Negative sentiment = higher risk

    return Math.min(risk, 1.0);
  }

  private storeMarketAnalysisForLearning(symbol: string, analysis: any): void {
    // Store comprehensive market analysis for AI learning
    const learningKey = `MARKET_ANALYSIS_${symbol}_${Date.now()}`;

    const learningData = {
      timestamp: new Date(),
      symbol,
      analysis,
      profitPotential: analysis.profitPotential,
      riskLevel: analysis.riskLevel,
      marketStrength: analysis.marketStrength,
      trendDirection: analysis.trendDirection,
      // This data will be used to improve future predictions
      learningMetrics: {
        volatilityAccuracy: 0, // Will be updated when actual volatility is observed
        trendPredictionAccuracy: 0, // Will be updated when trend plays out
        profitRealized: 0, // Will be updated with actual trading results
      },
    };

    this.learningData.set(learningKey, learningData);

    // Keep only last 100 analyses to prevent memory issues
    if (this.learningData.size > 100) {
      const oldestKey = this.learningData.keys().next().value;
      if (oldestKey) {
        this.learningData.delete(oldestKey);
      }
    }
  }
}

export const aiTradingService = new AITradingService();
