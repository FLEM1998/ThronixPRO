import { aiTradingService } from '../../server/ai-trading-service';
import { exchangeService } from '../../server/exchange-service';

// Mock external services
jest.mock('../../server/exchange-service');
jest.mock('../../server/market-data-service');
jest.mock('../../server/storage');

const mockExchangeService = exchangeService as jest.Mocked<typeof exchangeService>;

describe('AI Trading Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMarket', () => {
    it('should analyze market data and return comprehensive analysis', async () => {
      // Mock market data response
      const mockMarketData = {
        last: 50000,
        volume: 1000000,
        change: 2.5,
        high: 51000,
        low: 49000,
      };

      // Mock the market data service
      const marketDataService = require('../../server/market-data-service');
      marketDataService.marketDataService = {
        getCurrencyData: jest.fn().mockResolvedValue(mockMarketData),
      };

      const analysis = await aiTradingService.analyzeMarket('BTCUSDT', 'kucoin');

      expect(analysis).toBeDefined();
      expect(analysis.symbol).toBe('BTCUSDT');
      expect(analysis.currentPrice).toBe(50000);
      expect(analysis.trendDirection).toBeOneOf(['up', 'down', 'sideways']);
      expect(analysis.profitPotential).toBeGreaterThanOrEqual(0);
      expect(analysis.riskLevel).toBeGreaterThanOrEqual(0);
      expect(analysis.riskLevel).toBeLessThanOrEqual(1);
    });

    it('should handle market data unavailable', async () => {
      const marketDataService = require('../../server/market-data-service');
      marketDataService.marketDataService = {
        getCurrencyData: jest.fn().mockResolvedValue(null),
      };

      await expect(
        aiTradingService.analyzeMarket('INVALID', 'kucoin')
      ).rejects.toThrow('Live market data not available');
    });
  });

  describe('recordTradingOutcome', () => {
    it('should record profitable trade for learning', async () => {
      const signal = {
        action: 'BUY' as const,
        confidence: 0.8,
        reasoning: 'Test signal',
        riskScore: 0.3,
        marketSentiment: 'bullish' as const,
      };

      const marketConditions = {
        symbol: 'BTCUSDT',
        currentPrice: 50000,
        trendDirection: 'up' as const,
        volatility: 0.02,
        volume: 1000000,
        momentumScore: 0.7,
        supportLevel: 49000,
        resistanceLevel: 51000,
        rsiValue: 65,
        marketRegime: 'trending' as const,
        newsImpact: 0.1,
        sentimentScore: 0.6,
      };

      // This should not throw an error
      await expect(
        aiTradingService.recordTradingOutcome(1, signal, 100, marketConditions)
      ).resolves.not.toThrow();

      // Test learning insights
      const insights = aiTradingService.getLearningInsights(1);
      expect(insights.winRate).toBeGreaterThan(0);
      expect(insights.averageProfit).toBeGreaterThan(0);
    });

    it('should record losing trade and provide improvement suggestions', async () => {
      const signal = {
        action: 'SELL' as const,
        confidence: 0.6,
        reasoning: 'Test signal',
        riskScore: 0.7,
        marketSentiment: 'bearish' as const,
      };

      const marketConditions = {
        symbol: 'BTCUSDT',
        currentPrice: 50000,
        trendDirection: 'down' as const,
        volatility: 0.05,
        volume: 500000,
        momentumScore: 0.3,
        supportLevel: 48000,
        resistanceLevel: 52000,
        rsiValue: 35,
        marketRegime: 'volatile' as const,
        newsImpact: 0.3,
        sentimentScore: -0.2,
      };

      await aiTradingService.recordTradingOutcome(2, signal, -50, marketConditions);

      const insights = aiTradingService.getLearningInsights(2);
      expect(insights.averageProfit).toBeLessThan(0);
      expect(insights.improvementSuggestions).toContain('Reduce risk per trade to preserve capital');
    });
  });

  describe('getLearningInsights', () => {
    it('should return default insights for new bots', () => {
      const insights = aiTradingService.getLearningInsights(999);
      
      expect(insights.winRate).toBe(0);
      expect(insights.averageProfit).toBe(0);
      expect(insights.bestStrategy).toBe('insufficient_data');
      expect(insights.improvementSuggestions).toContain('Continue trading to gather learning data');
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, validOptions) {
    const pass = validOptions.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validOptions}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validOptions}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(validOptions: any[]): R;
    }
  }
}