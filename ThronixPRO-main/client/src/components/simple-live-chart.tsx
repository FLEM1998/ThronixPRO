import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimpleLiveChartProps {
  symbol: string;
  exchange?: string;
  className?: string;
}

interface ChartDataPoint {
  timestamp: number;
  time: string;
  price: number;
  volume: number;
  high: number;
  low: number;
}

interface ChartResponse {
  symbol: string;
  exchange: string;
  timeframe: string;
  current: {
    price: number;
    change: number;
    volume: number;
    high: number;
    low: number;
  };
  data: ChartDataPoint[];
  timestamp: number;
}

export default function SimpleLiveChart({ symbol, exchange = 'kucoin', className = '' }: SimpleLiveChartProps) {
  // Fetch chart data
  const { data: chartData, isLoading, error } = useQuery<ChartResponse>({
    queryKey: ['/api/market/chart', symbol, exchange, '1h'],
    queryFn: async () => {
      const response = await fetch(`/api/market/chart/${encodeURIComponent(symbol)}?exchange=${exchange}&timeframe=1h`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !!symbol,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className={`trading-card ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Loading Live Chart...</CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <div className="text-gray-400">Loading {symbol} live data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !chartData) {
    return (
      <Card className={`trading-card ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Chart Error</CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <div className="text-red-400">Failed to load live chart data for {symbol}</div>
        </CardContent>
      </Card>
    );
  }

  // Create simple line chart using CSS and div elements
  const prices = chartData.data.map(d => d.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice;

  return (
    <Card className={`trading-card ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-xl font-bold text-white">{symbol}</CardTitle>
            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-400">
              {chartData.exchange.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-400">
              Real Money Trading
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-white">
                {formatPrice(chartData.current.price)}
              </span>
              <span className={`text-xl font-semibold ${
                chartData.current.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {chartData.current.change >= 0 ? '+' : ''}{chartData.current.change.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400">24h High</span>
                <span className="text-white font-semibold">{formatPrice(chartData.current.high)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">24h Low</span>
                <span className="text-white font-semibold">{formatPrice(chartData.current.low)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Simple Price Chart */}
        <div className="h-[300px] w-full mb-6 bg-gray-900 rounded-lg border border-gray-700 p-4">
          <h4 className="text-white font-semibold mb-4">Live Price Chart - {symbol}</h4>
          <div className="relative h-[200px] w-full">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
              <span>{formatPrice(maxPrice)}</span>
              <span>{formatPrice((maxPrice + minPrice) / 2)}</span>
              <span>{formatPrice(minPrice)}</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-16 h-full bg-gray-800 rounded relative overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-rows-4 gap-0">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="border-b border-gray-600 border-dashed opacity-30"></div>
                ))}
              </div>
              
              {/* Price line */}
              <div className="absolute inset-0 flex items-end">
                {chartData.data.map((point, index) => {
                  const heightPercent = priceRange > 0 ? ((point.price - minPrice) / priceRange) * 100 : 50;
                  const leftPercent = (index / (chartData.data.length - 1)) * 100;
                  
                  return (
                    <div
                      key={index}
                      className="absolute w-1 bg-blue-400 rounded-t"
                      style={{
                        left: `${leftPercent}%`,
                        height: `${heightPercent}%`,
                        bottom: '0',
                      }}
                      title={`${new Date(point.timestamp).toLocaleTimeString()}: ${formatPrice(point.price)}`}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* X-axis labels */}
            <div className="ml-16 mt-2 flex justify-between text-xs text-gray-400">
              <span>{new Date(chartData.data[0]?.timestamp).toLocaleTimeString()}</span>
              <span>Live Data</span>
              <span>{new Date(chartData.data[chartData.data.length - 1]?.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Volume Display */}
        <div className="h-[100px] w-full bg-gray-900 rounded-lg border border-gray-700 p-4">
          <h4 className="text-white font-semibold mb-2">Volume</h4>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-400">
              {(chartData.current.volume / 1000000).toFixed(2)}M
            </span>
            <span className="text-gray-400">24h Volume</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Live data from {chartData.exchange.toUpperCase()} exchange</span>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400">
              Real-time
            </Badge>
          </div>
          <div>
            Updated: {new Date(chartData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}