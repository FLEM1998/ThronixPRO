import { exchangeService } from './exchange-service';
import { storage } from './storage';
import { WebSocket } from 'ws';

export class MarketDataService {
  private isRunning = false;
  private connections: Map<number, WebSocket> = new Map();
  private marketDataInterval: NodeJS.Timeout | null = null;

  public addConnection(userId: number, ws: WebSocket) {
    this.connections.set(userId, ws);
    if (!this.isRunning) {
      this.startMarketDataUpdates();
    }
  }

  public removeConnection(userId: number) {
    this.connections.delete(userId);
    if (this.connections.size === 0 && this.isRunning) {
      this.stopMarketDataUpdates();
    }
  }

  private async startMarketDataUpdates() {
    this.isRunning = true;
    console.log('Starting real-time market data updates');

    // Update market data every 5 seconds
    this.marketDataInterval = setInterval(async () => {
      try {
        await this.fetchAndBroadcastMarketData();
      } catch (error) {
        console.error('Market data update error:', error);
      }
    }, 5000);

    // Initial update with error handling
    try {
      await this.fetchAndBroadcastMarketData();
    } catch (error) {
      console.error('Initial market data fetch error:', error);
    }
  }

  private stopMarketDataUpdates() {
    this.isRunning = false;
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = null;
    }
    console.log('Stopped real-time market data updates');
  }

  private async fetchAndBroadcastMarketData() {
    const exchanges = ['kucoin', 'bybit', 'binance']; // Try multiple live exchanges
    let tickers: any[] = [];
    let successfulExchange = '';
    
    // Try each exchange until we get authentic live data
    for (const exchangeName of exchanges) {
      try {
        console.log(`Fetching live market data from ${exchangeName}...`);
        tickers = await exchangeService.getMarketTickers(exchangeName);
        if (tickers && tickers.length > 0) {
          successfulExchange = exchangeName;
          console.log(`Successfully fetched ${tickers.length} live tickers from ${exchangeName}`);
          break;
        }
      } catch (exchangeError) {
        console.log(`${exchangeName} failed, trying next exchange...`);
        continue;
      }
    }
    
    if (tickers.length === 0) {
      console.error('All exchanges failed to provide live data - broadcasting error');
      const errorUpdate = {
        type: 'market_error',
        data: {
          timestamp: Date.now(),
          message: 'Live market data temporarily unavailable. Connect exchange API keys to restore live data.',
          error: 'LIVE_DATA_REQUIRED'
        },
      };
      this.broadcast(errorUpdate);
      return;
    }
    
    // Store live market data in database
    const popularSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
    
    for (const ticker of tickers.slice(0, 20)) { // Top 20 by volume
      try {
        await storage.createMarketData({
          symbol: ticker.symbol,
          exchange: successfulExchange,
          price: ticker.last.toString(),
          volume: ticker.volume.toString(),
          change24h: ticker.percentage.toString(),
          high24h: ticker.high.toString(),
          low24h: ticker.low.toString(),
        });
      } catch (error) {
        // Ignore duplicate entries
      }
    }

    // Broadcast live market data to connected clients
    const marketUpdate = {
      type: 'market_update',
      data: {
        timestamp: Date.now(),
        tickers: tickers.slice(0, 50), // Top 50 live pairs
        popular: tickers.filter(t => popularSymbols.includes(t.symbol)),
        source: `live_${successfulExchange}_data`,
        exchange: successfulExchange
      },
    };

    this.broadcast(marketUpdate);

    // Broadcast live price updates for popular pairs
    const priceUpdate = {
      type: 'price_update',
      data: popularSymbols.reduce((acc, symbol) => {
        const ticker = tickers.find(t => t.symbol === symbol);
        if (ticker) {
          acc[symbol.replace('/', '')] = {
            price: ticker.last,
            change: ticker.percentage,
            volume: ticker.volume,
          };
        }
        return acc;
      }, {} as any),
    };

    this.broadcast(priceUpdate);
  }

  // Removed synthetic fallback data generation - platform now requires live exchange data only

  private broadcast(message: any) {
    try {
      const messageStr = JSON.stringify(message);
      
      this.connections.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            console.error(`Failed to send message to user ${userId}:`, error);
            this.connections.delete(userId);
          }
        } else {
          this.connections.delete(userId);
        }
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  public async getTopCurrencies() {
    const exchanges = ['kucoin', 'bybit', 'binance'];
    
    // Try each exchange until we get authentic live data
    for (const exchangeName of exchanges) {
      try {
        const tickers = await exchangeService.getMarketTickers(exchangeName);
        if (tickers && tickers.length > 0) {
          return tickers.slice(0, 100); // Top 100 by volume from live exchange
        }
      } catch (exchangeError) {
        continue;
      }
    }
    
    console.error('All exchanges failed to provide live currency data');
    return []; // Return empty array instead of synthetic data
  }

  public async getCurrencyData(symbol: string) {
    const exchanges = ['kucoin', 'bybit', 'binance'];
    
    // Try each exchange until we get authentic live data
    for (const exchangeName of exchanges) {
      try {
        const tickers = await exchangeService.getMarketTickers(exchangeName);
        if (tickers && tickers.length > 0) {
          const ticker = tickers.find(t => t.symbol === symbol);
          if (ticker) return ticker;
        }
      } catch (exchangeError) {
        continue;
      }
    }
    
    console.error(`Failed to fetch live data for ${symbol} from all exchanges`);
    return null;
  }
}

export const marketDataService = new MarketDataService();