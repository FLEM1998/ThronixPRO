import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, ColorType } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Volume2, Activity, BarChart3 } from 'lucide-react';

interface AdvancedTradingChartProps {
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

export default function AdvancedTradingChart({ symbol, exchange = 'kucoin', className = '' }: AdvancedTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  // Moving average toggle state
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Fetch chart data for the selected symbol
  const { data: chartData, isLoading, error } = useQuery<ChartResponse>({
    queryKey: ['chart', symbol, timeframe, exchange],
    queryFn: async () => {
      const response = await fetch(`/api/market/chart/${encodeURIComponent(symbol)}?timeframe=${timeframe}&exchange=${exchange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!symbol,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('Chart container not ready');
      return;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2d3748' },
        horzLines: { color: '#2d3748' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485563',
        textColor: '#d1d5db',
      },
      timeScale: {
        borderColor: '#485563',
        textColor: '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    // Add moving average line series
    const sma20Series = chart.addLineSeries({
      color: '#fbbf24', // amber for SMA20
      lineWidth: 2,
    });
    const sma50Series = chart.addLineSeries({
      color: '#6366f1', // indigo for SMA50
      lineWidth: 2,
    });

    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;

    // Set up price scale for volume
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    
    console.log('Chart initialized successfully');

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    console.log('Chart data update:', { chartData, hasCandlestickRef: !!candlestickSeriesRef.current, hasVolumeRef: !!volumeSeriesRef.current });
    if (!chartData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    // Convert data to lightweight-charts format
    const candlestickData: CandlestickData[] = chartData.data.map((point, index) => {
      // For the first point, use current price as open, otherwise use previous close
      const open = index === 0 ? point.price : chartData.data[index - 1]?.price || point.price;
      
      return {
        time: Math.floor(point.timestamp / 1000) as any,
        open: open,
        high: point.high,
        low: point.low,
        close: point.price,
      };
    });

    const volumeData: HistogramData[] = chartData.data.map(point => ({
      time: Math.floor(point.timestamp / 1000) as any,
      value: point.volume,
      color: point.price > (point.price * 0.999) ? '#26a69a' : '#ef5350',
    }));

    // Update series data
    console.log('Setting chart data:', { candlestickData: candlestickData.length, volumeData: volumeData.length });
    candlestickSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current.setData(volumeData);

    // Calculate moving averages
    const calculateSMA = (data: CandlestickData[], period: number): LineData[] => {
      const smaData: LineData[] = [];
      const prices: number[] = [];
      for (let i = 0; i < data.length; i++) {
        prices.push(data[i].close);
        if (i >= period - 1) {
          const slice = prices.slice(i - period + 1, i + 1);
          const sum = slice.reduce((acc, val) => acc + val, 0);
          const avg = sum / period;
          smaData.push({ time: data[i].time, value: avg });
        } else {
          // For initial periods, just repeat the close price
          smaData.push({ time: data[i].time, value: data[i].close });
        }
      }
      return smaData;
    };
    if (sma20SeriesRef.current && showSMA20) {
      const sma20 = calculateSMA(candlestickData, 20);
      sma20SeriesRef.current.setData(sma20);
    } else if (sma20SeriesRef.current) {
      sma20SeriesRef.current.setData([]);
    }
    if (sma50SeriesRef.current && showSMA50) {
      const sma50 = calculateSMA(candlestickData, 50);
      sma50SeriesRef.current.setData(sma50);
    } else if (sma50SeriesRef.current) {
      sma50SeriesRef.current.setData([]);
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
    
    console.log('Chart data updated successfully');
  }, [chartData]);

  const timeframes = [
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (isLoading) {
    return (
      <Card className={`trading-card ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Loading Chart...</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-gray-400">Loading {symbol} chart data...</div>
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
          <div className="text-red-400">Failed to load chart data for {symbol}</div>
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
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candlestick')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Price Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(chartData.current.price)}
              </span>
              <div className={`flex items-center space-x-1 ${chartData.current.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {chartData.current.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {chartData.current.change >= 0 ? '+' : ''}{chartData.current.change.toFixed(2)}%
                </span>
              </div>
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
              <div className="flex items-center space-x-1">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span className="text-white">{formatVolume(chartData.current.volume)}</span>
              </div>
            </div>
          </div>
          
          {/* Timeframe & Indicator Selector */}
          <div className="flex items-center space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="px-3 py-1 text-xs"
              >
                {tf.label}
              </Button>
            ))}
            {/* Moving Average Toggles */}
            <Button
              variant={showSMA20 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSMA20((prev) => !prev)}
              className="px-3 py-1 text-xs"
            >
              SMA20
            </Button>
            <Button
              variant={showSMA50 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSMA50((prev) => !prev)}
              className="px-3 py-1 text-xs"
            >
              SMA50
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Container */}
        <div 
          ref={chartContainerRef}
          className="w-full h-[400px] bg-gray-900 rounded-lg"
        />
        
        {/* Chart Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div>
            Last updated: {new Date(chartData.timestamp).toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <span>Timeframe: {timeframe.toUpperCase()}</span>
            <span>Exchange: {chartData.exchange.toUpperCase()}</span>
            <span>Data Points: {chartData.data.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}