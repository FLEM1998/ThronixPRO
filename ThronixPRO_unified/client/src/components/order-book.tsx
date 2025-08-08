import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookData {
  symbol: string;
  exchange: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

interface OrderBookProps {
  symbol: string;
  exchange?: string;
}

export default function OrderBook({ symbol, exchange = 'kucoin' }: OrderBookProps) {
  const [maxTotal, setMaxTotal] = useState(0);

  // Fetch real-time order book data
  const { data: orderBookData, isLoading } = useQuery<OrderBookData>({
    queryKey: ['order-book', symbol, exchange],
    queryFn: async () => {
      const response = await fetch(`/api/order-book?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order book: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 2000, // update every 2 seconds for near real-time
    enabled: !!symbol,
  });

  // Calculate max total for visualization bars
  useEffect(() => {
    if (orderBookData) {
      const allTotals = [...orderBookData.bids, ...orderBookData.asks].map(entry => entry.total);
      setMaxTotal(Math.max(...allTotals));
    }
  }, [orderBookData]);

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toFixed(8);
  };

  const formatQuantity = (quantity: number) => {
    if (quantity >= 1000000) return `${(quantity / 1000000).toFixed(2)}M`;
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(2)}K`;
    return quantity.toFixed(4);
  };

  const getBarWidth = (total: number) => {
    return maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Order Book
          </h3>
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
            <Activity className="w-3 h-3 mr-1" />
            Real-Time
          </Badge>
        </div>
        <div className="text-center text-gray-400 py-8">
          Loading order book data...
        </div>
      </div>
    );
  }

  if (!orderBookData) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Order Book
          </h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          No order book data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Order Book - {symbol}
        </h3>
        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
          <Activity className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex items-center mb-2">
            <TrendingDown className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-sm font-medium text-red-400">Asks (Sell)</span>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 mb-2 px-1">
              <span className="truncate">Price</span>
              <span className="text-right truncate">Size</span>
              <span className="text-right truncate">Total</span>
            </div>
            {orderBookData.asks.slice(0, 10).reverse().map((ask, index) => (
              <div key={index} className="relative">
                <div 
                  className="absolute inset-0 bg-red-500/10 rounded"
                  style={{ width: `${getBarWidth(ask.total)}%` }}
                />
                <div className="relative grid grid-cols-3 gap-1 text-xs py-1 px-1">
                  <span className="text-red-400 font-mono text-left truncate">${formatPrice(ask.price)}</span>
                  <span className="text-right text-white truncate">{formatQuantity(ask.quantity)}</span>
                  <span className="text-right text-gray-300 truncate">{formatQuantity(ask.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-400">Bids (Buy)</span>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 mb-2 px-1">
              <span className="truncate">Price</span>
              <span className="text-right truncate">Size</span>
              <span className="text-right truncate">Total</span>
            </div>
            {orderBookData.bids.slice(0, 10).map((bid, index) => (
              <div key={index} className="relative">
                <div 
                  className="absolute inset-0 bg-green-500/10 rounded"
                  style={{ width: `${getBarWidth(bid.total)}%` }}
                />
                <div className="relative grid grid-cols-3 gap-1 text-xs py-1 px-1">
                  <span className="text-green-400 font-mono text-left truncate">${formatPrice(bid.price)}</span>
                  <span className="text-right text-white truncate">{formatQuantity(bid.quantity)}</span>
                  <span className="text-right text-gray-300 truncate">{formatQuantity(bid.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spread Information */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Spread:</span>
          <span className="text-white font-mono">
            ${formatPrice(orderBookData.asks[0]?.price - orderBookData.bids[0]?.price || 0)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-400">Spread %:</span>
          <span className="text-white">
            {orderBookData.asks[0] && orderBookData.bids[0] 
              ? (((orderBookData.asks[0].price - orderBookData.bids[0].price) / orderBookData.bids[0].price) * 100).toFixed(4)
              : '0.0000'}%
          </span>
        </div>
      </div>
    </div>
  );
}