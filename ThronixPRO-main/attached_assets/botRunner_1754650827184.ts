import { getMarketData, placeTrade, logTrade } from '../utils/tradingUtils';
import { generateTradingStrategy } from './strategyGenerator';

let activeBots: Record<string, any> = {};

export async function startBot(userId: string, coin: string) {
  const strategy = await generateTradingStrategy();
  activeBots[userId] = { coin, strategy, trades: [] };

  setInterval(async () => {
    const data = await getMarketData(coin);
    const bot = activeBots[userId];
    if (!bot) return;

    const signal = evaluateStrategy(bot.strategy, data);
    if (signal === 'buy' || signal === 'sell') {
      const result = await placeTrade(userId, coin, signal);
      bot.trades.push(result);
      await logTrade(userId, coin, bot.strategy, result);
    }

    if (bot.trades.length >= 10) {
      const winRate = bot.trades.filter(t => t.pnl > 0).length / 10 * 100;
      if (winRate < 50) {
        bot.strategy = await generateTradingStrategy();
        bot.trades = [];
      }
    }
  }, 60000);
}

export function stopBot(userId: string) {
  delete activeBots[userId];
}

function evaluateStrategy(strategy: any, data: any): 'buy' | 'sell' | null {
  // Placeholder: apply strategy rules to market data
  return Math.random() > 0.5 ? 'buy' : 'sell';
}