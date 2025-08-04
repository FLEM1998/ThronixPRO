import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimpleTradingChartProps {
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

export default function SimpleTradingChart({ symbol, exchange = 'kucoin', className = '' }: SimpleTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

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

  // Initialize chart when container is ready
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('Chart container not available yet');
      return;
    }

    console.log('Initializing chart...');
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    console.log('Chart initialized successfully', {
      hasChart: !!chart,
      hasCandlestick: !!candlestickSeries,
      containerWidth: chartContainerRef.current?.clientWidth
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, []);

  // Update chart data when data changes
  useEffect(() => {
    if (!chartData || !candlestickSeriesRef.current) {
      console.log('Chart data update skipped:', { hasData: !!chartData, hasRef: !!candlestickSeriesRef.current });
      return;
    }

    const candlestickData: CandlestickData[] = chartData.data.map(point => ({
      time: Math.floor(point.timestamp / 1000) as any,
      open: point.price * 0.999,
      high: point.high,
      low: point.low,
      close: point.price,
    }));

    console.log('Updating chart with data points:', candlestickData.length);
    candlestickSeriesRef.current.setData(candlestickData);
    
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

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
        <CardContent className="h-[400px] flex items-center justify-center">
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
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-red-400">Failed to load live chart data for {symbol}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`trading-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-white flex items-center space-x-2">
              <span>{symbol}</span>
              <Badge variant="outline" className="text-xs">
                {chartData.exchange.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400">
                Real Money Trading
              </Badge>
            </CardTitle>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(chartData.current.price)}
              </span>
              <span className={`text-lg font-semibold ${
                chartData.current.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {chartData.current.change >= 0 ? '+' : ''}{chartData.current.change.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">24h High:</span>
                <span className="text-white">{formatPrice(chartData.current.high)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">24h Low:</span>
                <span className="text-white">{formatPrice(chartData.current.low)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          ref={chartContainerRef}
          className="w-full h-[400px] bg-gray-900 rounded-lg"
        />
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div>
            Live data from {chartData.exchange.toUpperCase()} exchange
          </div>
          <div>
            Last updated: {new Date(chartData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}