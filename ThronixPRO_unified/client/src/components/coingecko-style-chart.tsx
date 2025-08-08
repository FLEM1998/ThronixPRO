import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface CoinGeckoStyleChartProps {
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

export default function CoinGeckoStyleChart({ symbol, exchange = 'kucoin', className = '' }: CoinGeckoStyleChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');

  
  // Fetch chart data with dynamic timeframe
  const { data: chartData, isLoading, error } = useQuery<ChartResponse>({
    queryKey: ['/api/market/chart', symbol, exchange, selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/chart/${encodeURIComponent(symbol)}?exchange=${exchange}&timeframe=${selectedTimeframe}`);
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

  // Check for flat price data
  const checkFlatPrice = (data: ChartDataPoint[]) => {
    if (!data || data.length === 0) return false;
    
    const prices = data.map(point => point.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    return maxPrice === minPrice;
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

  // Check for flat price data and prepare chart data for SVG
  const prices = chartData.data.map(d => d.price).filter(p => !isNaN(p) && isFinite(p));
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const isFlat = maxPrice === minPrice;
  const priceRange = isFlat ? 1 : maxPrice - minPrice; // Handle flat price scenario
  
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 40;
  
  // Calculate total volume from chart data
  const totalVolume = chartData.data.reduce((sum, point) => {
    const volume = parseFloat(point.volume?.toString() || '0');
    return sum + (isNaN(volume) ? 0 : volume);
  }, 0);
  
  // Format volume display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  };
  
  // Create SVG path for price line
  const createPath = () => {
    if (chartData.data.length === 0) return '';
    
    let path = '';
    chartData.data.forEach((point, index) => {
      const x = padding + (index / (chartData.data.length - 1)) * (chartWidth - 2 * padding);
      
      // For flat price data, draw line at center height
      const y = isFlat 
        ? chartHeight / 2 
        : chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - 2 * padding);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  // Create SVG path for area fill
  const createAreaPath = () => {
    if (chartData.data.length === 0) return '';
    
    let path = createPath();
    
    // Add bottom line to close the area
    const lastX = padding + ((chartData.data.length - 1) / (chartData.data.length - 1)) * (chartWidth - 2 * padding);
    const firstX = padding;
    const bottom = chartHeight - padding;
    
    path += ` L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
    
    return path;
  };

  const linePath = createPath();
  const areaPath = createAreaPath();
  
  // Price axis labels
  const priceSteps = 5;
  const priceLabels = [];
  for (let i = 0; i <= priceSteps; i++) {
    const price = minPrice + (priceRange * i) / priceSteps;
    const y = chartHeight - padding - (i / priceSteps) * (chartHeight - 2 * padding);
    priceLabels.push({ price, y });
  }

  const isPositive = chartData.current.change >= 0;

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
            {isFlat && (
              <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500">
                No Price Change
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Price and Change Row */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {formatPrice(chartData.current.price)}
            </span>
            <span className={`text-lg sm:text-xl font-semibold flex items-center ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> : <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 rotate-180" />}
              {isPositive ? '+' : ''}{chartData.current.change.toFixed(2)}%
            </span>
          </div>
          
          {/* 24h High/Low Row - Mobile Optimized */}
          <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
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

        {/* Timeframe buttons like CoinGecko */}
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-gray-400 text-sm">Timeframe:</span>
          <div className="flex space-x-1">
            {[
              { label: '1H', value: '1h' },
              { label: '4H', value: '4h' },
              { label: '1D', value: '1d' },
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' }
            ].map((tf) => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf.value)}
                aria-label={`Switch to ${tf.label} timeframe`}
                aria-pressed={selectedTimeframe === tf.value}
                className={`h-6 px-2 text-xs ${
                  selectedTimeframe === tf.value
                    ? 'bg-blue-600 text-white' 
                    : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* CoinGecko-style SVG Chart */}
        <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Price chart for ${symbol} showing ${isFlat ? 'no price change' : (isPositive ? 'positive' : 'negative')} movement over ${selectedTimeframe}`}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Area fill gradient like CoinGecko */}
            <defs>
              <linearGradient id={`areaGradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: isPositive ? '#10b981' : '#ef4444', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: isPositive ? '#10b981' : '#ef4444', stopOpacity: 0.05 }} />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill={`url(#areaGradient-${symbol})`}
            />
            
            {/* Price line - dotted if flat */}
            <path
              d={linePath}
              fill="none"
              stroke={isFlat ? '#9ca3af' : (isPositive ? '#10b981' : '#ef4444')}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isFlat ? "8,4" : "none"}
              aria-label={`Price trend line for ${symbol}`}
            />
            
            {/* Price labels on right axis */}
            {priceLabels.map((label, index) => (
              <g key={index}>
                <line
                  x1={chartWidth - padding}
                  y1={label.y}
                  x2={chartWidth - padding + 5}
                  y2={label.y}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth - padding + 10}
                  y={label.y + 4}
                  fill="#9ca3af"
                  fontSize="11"
                  textAnchor="start"
                >
                  {formatPrice(label.price)}
                </text>
              </g>
            ))}
            
            {/* Data points */}
            {chartData.data.map((point, index) => {
              const x = padding + (index / (chartData.data.length - 1)) * (chartWidth - 2 * padding);
              const y = isFlat 
                ? chartHeight / 2 
                : chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - 2 * padding);
              
              // Only render if coordinates are valid numbers
              if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
                return null;
              }
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={isFlat ? '#9ca3af' : (isPositive ? '#10b981' : '#ef4444')}
                  opacity="0.8"
                  className="hover:opacity-100 cursor-pointer"
                  aria-label={`Price at ${point.time}: ${formatPrice(point.price)}`}
                  role="button"
                  tabIndex={0}
                >
                  <title>{`${new Date(point.timestamp).toLocaleTimeString()}: ${formatPrice(point.price)}`}</title>
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Volume bar like CoinGecko */}
        <div className="mt-6 bg-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Volume
            </h4>
            <span className="text-gray-400 text-sm">24h</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-blue-400">
              {formatVolume(totalVolume || chartData.current.volume)}
            </span>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
              USDT Volume
            </Badge>
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