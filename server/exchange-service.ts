import ccxt from 'ccxt';
import crypto from 'crypto';
import { ApiKey } from '@shared/schema';

export interface ExchangeBalance {
  symbol: string;
  free: number;
  used: number;
  total: number;
}

export interface ExchangeTicker {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  change: number;
  percentage: number;
  volume: number;
  high: number;
  low: number;
}

export interface PlaceOrderParams {
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
}

export interface ExchangeOrder {
  id: string;
  symbol: string;
  type: string;
  side: string;
  amount: number;
  price: number;
  filled: number;
  remaining: number;
  status: string;
  timestamp: number;
}

export class ExchangeService {
  private exchanges: Map<string, ccxt.Exchange> = new Map();
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  private encrypt(text: string): string {
    try {
      // Use simple base64 encoding for now to avoid encryption issues
      // In production, this should use proper AES encryption
      return Buffer.from(text).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      // Check if it's base64 encoded (new format)
      if (encryptedText.match(/^[A-Za-z0-9+/=]+$/)) {
        const decrypted = Buffer.from(encryptedText, 'base64').toString('utf8');
        // Clean and validate the decrypted string
        return decrypted.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      }
      
      // Fallback for old encryption format
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      const parts = encryptedText.split(':');
      
      if (parts.length !== 2) {
        // Try old decipher method
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - API key may need to be re-added');
    }
  }

  private createExchangeInstance(apiKey: ApiKey): ccxt.Exchange {
    const decryptedApiKey = this.decrypt(apiKey.apiKey);
    const decryptedSecret = this.decrypt(apiKey.secretKey);
    
    // Validate API key format
    if (!decryptedApiKey || !decryptedSecret) {
      throw new Error('Invalid API credentials after decryption');
    }
    
    // Ensure API key contains only valid characters
    const validApiKeyRegex = /^[A-Za-z0-9]+$/;
    if (!validApiKeyRegex.test(decryptedApiKey)) {
      console.error('Invalid API key format:', decryptedApiKey.length, 'chars');
      throw new Error('API key contains invalid characters');
    }
    
    console.log('Connecting to', apiKey.exchange, 'with key length:', decryptedApiKey.length);
    
    const config: any = {
      apiKey: decryptedApiKey,
      secret: decryptedSecret,
      sandbox: apiKey.testnet,
      enableRateLimit: true,
    };

    // Add passphrase for KuCoin
    if (apiKey.exchange === 'kucoin' && apiKey.passphrase) {
      config.password = this.decrypt(apiKey.passphrase);
    }

    switch (apiKey.exchange.toLowerCase()) {
      case 'binance':
        return new ccxt.binance(config);
      case 'kucoin':
        return new ccxt.kucoin(config);
      case 'bybit':
        return new ccxt.bybit(config);
      default:
        throw new Error(`Unsupported exchange: ${apiKey.exchange}`);
    }
  }

  public async initializeExchange(apiKey: ApiKey): Promise<void> {
    try {
      const exchange = this.createExchangeInstance(apiKey);
      await exchange.loadMarkets();
      
      // Test the connection
      await exchange.fetchBalance();
      
      this.exchanges.set(`${apiKey.userId}-${apiKey.exchange}`, exchange);
      console.log(`Successfully connected to ${apiKey.exchange} for user ${apiKey.userId}`);
    } catch (error) {
      console.error(`Failed to connect to ${apiKey.exchange}:`, error);
      throw new Error(`Failed to connect to ${apiKey.exchange}: ${error.message}`);
    }
  }

  public async getBalance(userId: number, exchange: string): Promise<ExchangeBalance[]> {
    const exchangeInstance = this.exchanges.get(`${userId}-${exchange}`);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} not initialized for user ${userId}`);
    }

    try {
      const balance = await exchangeInstance.fetchBalance();
      const balances: ExchangeBalance[] = [];

      for (const [symbol, data] of Object.entries(balance)) {
        if (symbol !== 'info' && symbol !== 'free' && symbol !== 'used' && symbol !== 'total') {
          const balanceData = data as any;
          if (balanceData.total > 0) {
            balances.push({
              symbol,
              free: balanceData.free || 0,
              used: balanceData.used || 0,
              total: balanceData.total || 0,
            });
          }
        }
      }

      return balances;
    } catch (error) {
      console.error(`Error fetching balance from ${exchange}:`, error);
      throw error;
    }
  }

  public async getTicker(userId: number, exchange: string, symbol: string): Promise<ExchangeTicker> {
    const exchangeInstance = this.exchanges.get(`${userId}-${exchange}`);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} not initialized for user ${userId}`);
    }

    try {
      const ticker = await exchangeInstance.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        last: ticker.last || 0,
        bid: ticker.bid || 0,
        ask: ticker.ask || 0,
        change: ticker.change || 0,
        percentage: ticker.percentage || 0,
        volume: ticker.baseVolume || 0,
        high: ticker.high || 0,
        low: ticker.low || 0,
      };
    } catch (error) {
      console.error(`Error fetching ticker for ${symbol} from ${exchange}:`, error);
      throw error;
    }
  }

  public async placeOrder(userId: number, exchangeName: string, params: PlaceOrderParams): Promise<ExchangeOrder> {
    const exchange = this.exchanges.get(`${userId}-${exchangeName}`);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeName} not initialized for user ${userId}`);
    }

    try {
      // VERIFY REAL BALANCE BEFORE PLACING ORDER
      const balances = await this.getBalance(userId, exchangeName);
      const [baseSymbol, quoteSymbol] = params.symbol.split('/');
      
      if (params.side === 'buy') {
        // Check quote currency balance for buy orders (e.g., USDT for BTC/USDT)
        const quoteBalance = balances.find(b => b.symbol === quoteSymbol);
        const requiredAmount = params.amount * (params.price || 0);
        
        if (!quoteBalance || quoteBalance.free < requiredAmount) {
          throw new Error(`Insufficient ${quoteSymbol} balance. Required: ${requiredAmount.toFixed(6)}, Available: ${quoteBalance?.free.toFixed(6) || '0'}`);
        }
        
        console.log(`✓ Balance verified for BUY: ${requiredAmount.toFixed(6)} ${quoteSymbol} (Available: ${quoteBalance.free.toFixed(6)})`);
      } else {
        // Check base currency balance for sell orders (e.g., BTC for BTC/USDT)
        const baseBalance = balances.find(b => b.symbol === baseSymbol);
        
        if (!baseBalance || baseBalance.free < params.amount) {
          throw new Error(`Insufficient ${baseSymbol} balance. Required: ${params.amount.toFixed(6)}, Available: ${baseBalance?.free.toFixed(6) || '0'}`);
        }
        
        console.log(`✓ Balance verified for SELL: ${params.amount.toFixed(6)} ${baseSymbol} (Available: ${baseBalance.free.toFixed(6)})`);
      }

      console.log(`Placing LIVE order: ${params.side.toUpperCase()} ${params.amount} ${params.symbol} on ${exchangeName}`);
      
      const order = await exchange.createOrder(
        params.symbol,
        params.type,
        params.side,
        params.amount,
        params.price
      );

      const result = {
        id: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price || 0,
        filled: order.filled || 0,
        remaining: order.remaining || 0,
        status: order.status,
        timestamp: order.timestamp || Date.now(),
      };

      console.log(`✓ LIVE ORDER PLACED: ${result.id} - ${result.side} ${result.amount} ${result.symbol} at ${result.price}`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ Order placement failed on ${exchangeName}:`, error.message);
      throw new Error(`Order failed: ${error.message}`);
    }
  }

  public async getOrderStatus(userId: number, exchangeName: string, orderId: string, symbol: string): Promise<ExchangeOrder> {
    const exchange = this.exchanges.get(`${userId}-${exchangeName}`);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeName} not initialized for user ${userId}`);
    }

    try {
      const order = await exchange.fetchOrder(orderId, symbol);
      return {
        id: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price || 0,
        filled: order.filled || 0,
        remaining: order.remaining || 0,
        status: order.status,
        timestamp: order.timestamp || Date.now(),
      };
    } catch (error) {
      console.error(`Error fetching order status from ${exchangeName}:`, error);
      throw error;
    }
  }

  public async cancelOrder(userId: number, exchangeName: string, orderId: string, symbol: string): Promise<void> {
    const exchange = this.exchanges.get(`${userId}-${exchangeName}`);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeName} not initialized for user ${userId}`);
    }

    try {
      await exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error(`Error canceling order on ${exchangeName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch the current order book for a symbol on a given exchange.  This method
   * does not require the user to have API keys for the exchange; it uses
   * ccxt’s public endpoints to retrieve the top levels of the order book.
   *
   * @param exchangeName The name of the exchange (e.g. 'binance', 'kucoin', 'bybit').
   * @param symbol The trading pair (e.g. 'BTC/USDT').
   * @param limit Optional number of levels per side to return. Defaults to 20.
   * @returns An object with bids and asks arrays sorted by price.
   */
  public async getOrderBookData(exchangeName: string, symbol: string, limit: number = 20): Promise<{
    bids: { price: number; quantity: number; total: number }[];
    asks: { price: number; quantity: number; total: number }[];
  }> {
    // Build a public exchange instance.  We avoid reusing the authenticated
    // instances here to ensure we can fetch order books without API keys.
    let exchange: ccxt.Exchange;
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        exchange = new ccxt.binance({ enableRateLimit: true });
        break;
      case 'kucoin':
        exchange = new ccxt.kucoin({ enableRateLimit: true });
        break;
      case 'bybit':
        exchange = new ccxt.bybit({ enableRateLimit: true });
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    try {
      // Ensure markets are loaded before fetching order book
      await exchange.loadMarkets();
      const orderBook = await exchange.fetchOrderBook(symbol, limit);
      // Map to a uniform structure
      const bids = (orderBook.bids || []).slice(0, limit).map(([price, quantity]: [number, number]) => ({
        price,
        quantity,
        total: price * quantity,
      }));
      const asks = (orderBook.asks || []).slice(0, limit).map(([price, quantity]: [number, number]) => ({
        price,
        quantity,
        total: price * quantity,
      }));
      return { bids, asks };
    } catch (error) {
      console.error(`Error fetching order book for ${symbol} on ${exchangeName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch the most recent trades for a symbol on a given exchange.  Uses ccxt’s
   * public trade endpoints and does not require authentication.
   *
   * @param exchangeName Exchange name (e.g. 'binance').
   * @param symbol Trading pair (e.g. 'BTC/USDT').
   * @param limit Optional number of trades to return. Defaults to 50.
   */
  public async getRecentTrades(exchangeName: string, symbol: string, limit: number = 50): Promise<ccxt.Trade[]> {
    let exchange: ccxt.Exchange;
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        exchange = new ccxt.binance({ enableRateLimit: true });
        break;
      case 'kucoin':
        exchange = new ccxt.kucoin({ enableRateLimit: true });
        break;
      case 'bybit':
        exchange = new ccxt.bybit({ enableRateLimit: true });
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }
    try {
      await exchange.loadMarkets();
      const trades = await exchange.fetchTrades(symbol, undefined, limit);
      return trades;
    } catch (error) {
      console.error(`Error fetching trades for ${symbol} on ${exchangeName}:`, error);
      throw error;
    }
  }

  public async getAllTradingPairs(exchangeName: string): Promise<string[]> {
    let exchange: ccxt.Exchange;
    
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        exchange = new ccxt.binance({ enableRateLimit: true });
        break;
      case 'kucoin':
        exchange = new ccxt.kucoin({ enableRateLimit: true });
        break;
      case 'bybit':
        exchange = new ccxt.bybit({ enableRateLimit: true });
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    try {
      await exchange.loadMarkets();
      return Object.keys(exchange.markets).sort();
    } catch (error) {
      console.error(`Error fetching trading pairs from ${exchangeName}:`, error);
      return [];
    }
  }

  public async getMarketTickers(exchangeName: string): Promise<ExchangeTicker[]> {
    // Use a public instance for market data
    let exchange: ccxt.Exchange;
    
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        exchange = new ccxt.binance({ enableRateLimit: true });
        break;
      case 'kucoin':
        exchange = new ccxt.kucoin({ enableRateLimit: true });
        break;
      case 'bybit':
        exchange = new ccxt.bybit({ enableRateLimit: true });
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    try {
      const tickers = await exchange.fetchTickers();
      const result: ExchangeTicker[] = [];

      // Define major cryptocurrency pairs we want to prioritize
      const majorPairs = [
        'BTC/USDT', 'BTC/USD', 'BTC/USDC',
        'ETH/USDT', 'ETH/USD', 'ETH/USDC', 
        'SOL/USDT', 'SOL/USD', 'SOL/USDC',
        'ADA/USDT', 'XRP/USDT', 'DOT/USDT', 
        'MATIC/USDT', 'AVAX/USDT', 'LINK/USDT',
        'UNI/USDT', 'LTC/USDT', 'BCH/USDT',
        'FIL/USDT', 'ATOM/USDT', 'ICP/USDT'
      ];

      // First, get major cryptocurrency pairs
      for (const symbol of majorPairs) {
        if (tickers[symbol] && tickers[symbol].last) {
          const ticker = tickers[symbol];
          result.push({
            symbol: ticker.symbol,
            last: ticker.last || 0,
            bid: ticker.bid || 0,
            ask: ticker.ask || 0,
            change: ticker.change || 0,
            percentage: ticker.percentage || 0,
            volume: ticker.baseVolume || 0,
            high: ticker.high || 0,
            low: ticker.low || 0,
          });
        }
      }

      // If we don't have enough major pairs, fill with high-volume pairs
      if (result.length < 20) {
        const remainingTickers = Object.values(tickers)
          .filter(ticker => 
            ticker.baseVolume && 
            ticker.baseVolume > 0 && 
            ticker.last && 
            ticker.last > 0.001 && // Filter out micro-cap coins
            !majorPairs.includes(ticker.symbol) &&
            !result.find(r => r.symbol === ticker.symbol)
          )
          .sort((a, b) => (b.baseVolume || 0) - (a.baseVolume || 0))
          .slice(0, 30);

        for (const ticker of remainingTickers) {
          result.push({
            symbol: ticker.symbol,
            last: ticker.last || 0,
            bid: ticker.bid || 0,
            ask: ticker.ask || 0,
            change: ticker.change || 0,
            percentage: ticker.percentage || 0,
            volume: ticker.baseVolume || 0,
            high: ticker.high || 0,
            low: ticker.low || 0,
          });
        }
      }

      console.log(`Fetched ${result.length} market tickers from ${exchangeName}, including major pairs`);

      return result;
    } catch (error) {
      console.error(`Error fetching market tickers from ${exchangeName}:`, error);
      throw error;
    }
  }

  public encryptApiKey(apiKey: string): string {
    return this.encrypt(apiKey);
  }

  public encryptSecret(secret: string): string {
    return this.encrypt(secret);
  }
}

export const exchangeService = new ExchangeService();