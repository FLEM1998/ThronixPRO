import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TradingChartProps {
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

export default function RechartsTradingChart({ symbol, exchange = 'kucoin', className = '' }: TradingChartProps) {
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTooltipPrice = (value: number) => {
    return formatPrice(value);
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

  // Prepare chart data
  const chartDataFormatted = chartData.data.map(point => ({
    time: formatTime(point.timestamp),
    price: point.price,
    high: point.high,
    low: point.low,
    volume: point.volume,
    timestamp: point.timestamp,
  }));

  const priceColor = chartData.current.change >= 0 ? '#26a69a' : '#ef5350';

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
        {/* Price Chart */}
        <div className="h-[300px] w-full mb-6">
          <h4 className="text-white font-semibold mb-2">Price Chart</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartDataFormatted}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#d1d5db"
                fontSize={12}
              />
              <YAxis 
                stroke="#d1d5db"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#d1d5db'
                }}
                formatter={(value: number) => [formatTooltipPrice(value), 'Price']}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={priceColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: priceColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="h-[200px] w-full">
          <h4 className="text-white font-semibold mb-2">Volume</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartDataFormatted}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#d1d5db"
                fontSize={12}
              />
              <YAxis 
                stroke="#d1d5db"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#d1d5db'
                }}
                formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Bar 
                dataKey="volume" 
                fill="#6366f1"
                opacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
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