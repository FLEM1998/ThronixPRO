import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkingChartProps {
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

export default function WorkingChart({ symbol, exchange = 'kucoin', className = '' }: WorkingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

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

  // Initialize chart when container and data are ready
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      console.log('Container not ready, waiting...');
      // Try again after a short delay
      const timer = setTimeout(() => {
        if (chartContainerRef.current && !chartInstanceRef.current) {
          initializeChart();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    initializeChart();

    function initializeChart() {
      const container = chartContainerRef.current;
      if (!container) return;

      try {
        console.log('Creating chart instance', { containerWidth: container.clientWidth, containerHeight: container.clientHeight });
        
        // Clear any existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.remove();
          chartInstanceRef.current = null;
          seriesRef.current = null;
        }

      const chart = createChart(container, {
        width: container.clientWidth,
        height: 400,
        layout: {
          background: { color: '#1f2937' },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#4b5563' },
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

      chartInstanceRef.current = chart;
      seriesRef.current = candlestickSeries;

        console.log('Chart created successfully', { 
          hasChart: !!chart, 
          hasSeries: !!candlestickSeries,
          containerWidth: container.clientWidth 
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          if (chart && container) {
            chart.applyOptions({ width: container.clientWidth });
          }
        });
        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
          if (chartInstanceRef.current) {
            chartInstanceRef.current.remove();
            chartInstanceRef.current = null;
            seriesRef.current = null;
          }
        };
      } catch (error) {
        console.error('Chart initialization failed:', error);
        return () => {};
      }
    }
  }, []);

  // Update chart data
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartInstanceRef.current) {
      console.log('Chart data update conditions:', {
        hasData: !!chartData,
        hasSeries: !!seriesRef.current,
        hasChart: !!chartInstanceRef.current
      });
      return;
    }

    console.log('Updating chart with data points:', chartData.data.length);

    const candlestickData: CandlestickData[] = chartData.data.map(point => ({
      time: Math.floor(point.timestamp / 1000) as any,
      open: point.price * 0.999,
      high: point.high,
      low: point.low,
      close: point.price,
    }));

    seriesRef.current.setData(candlestickData);
    chartInstanceRef.current.timeScale().fitContent();
    
    console.log('Chart updated successfully');
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
        <CardContent className="h-[450px] flex items-center justify-center">
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
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="text-red-400">Failed to load live chart data for {symbol}</div>
        </CardContent>
      </Card>
    );
  }

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
        <div 
          ref={chartContainerRef}
          className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-700"
        />
        
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