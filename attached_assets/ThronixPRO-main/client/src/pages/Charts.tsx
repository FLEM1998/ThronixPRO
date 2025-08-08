import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, TrendingDown, Activity, DollarSign, ArrowLeft, Crown } from "lucide-react";
import { useLocation } from "wouter";
import { useTitle } from "@/hooks/useTitle";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CoinGeckoStyleChart from "@/components/coingecko-style-chart";

interface MarketTicker {
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

interface ChartData {
  time: string;
  price: number;
  volume: number;
}

export default function Charts() {
  useTitle("ThronixPRO - Live Charts & Market Data");
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [timeframe, setTimeframe] = useState("1h");
  const [selectedExchange, setSelectedExchange] = useState("kucoin");

  // Fetch market data for all cryptocurrencies
  const { data: marketData = [], isLoading: isLoadingMarket } = useQuery<MarketTicker[]>({
    queryKey: ['/api/market/tickers'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Auto-select first cryptocurrency when data loads
  useEffect(() => {
    if (marketData && Array.isArray(marketData) && marketData.length > 0 && !selectedSymbol) {
      setSelectedSymbol(marketData[0].symbol);
    }
  }, [marketData, selectedSymbol]);

  // Chart data requires live exchange connection for historical data
  const chartData = useMemo(() => {
    // Live trading platform - no synthetic chart data
    // Historical price data must come from real exchange APIs
    return [];
  }, [marketData, selectedSymbol]);

  // Filter cryptocurrencies based on search
  const filteredCryptos = useMemo(() => {
    if (!marketData || !Array.isArray(marketData)) return [];
    
    return marketData
      .filter((ticker: MarketTicker) => 
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 20); // Limit to top 20 results
  }, [marketData, searchTerm]);

  // Get selected ticker details
  const selectedTicker = useMemo(() => {
    if (!marketData || !Array.isArray(marketData) || !selectedSymbol) return null;
    return marketData.find((t: MarketTicker) => t.symbol === selectedSymbol);
  }, [marketData, selectedSymbol]);

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    if (price >= 0.00000001) return price.toFixed(8);
    return price.toExponential(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="text-white/80 hover:text-white p-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">ThronixPRO Charts</span>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <Activity className="w-3 h-3 mr-1" />
              Real Money Data
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Page Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Live Crypto Charts</h1>
          <p className="text-white/80 text-sm lg:text-base">
            Real-time cryptocurrency prices and charts from live exchanges
          </p>
        </div>

      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search cryptocurrencies (e.g., BTC, ETH, ADA)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
        <Select value={selectedExchange} onValueChange={setSelectedExchange}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="kucoin" className="text-white hover:bg-gray-700">KuCoin</SelectItem>
            <SelectItem value="bybit" className="text-white hover:bg-gray-700">Bybit</SelectItem>
            <SelectItem value="binance" className="text-white hover:bg-gray-700">Binance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="1m" className="text-white hover:bg-gray-700">1 Minute</SelectItem>
            <SelectItem value="5m" className="text-white hover:bg-gray-700">5 Minutes</SelectItem>
            <SelectItem value="1h" className="text-white hover:bg-gray-700">1 Hour</SelectItem>
            <SelectItem value="4h" className="text-white hover:bg-gray-700">4 Hours</SelectItem>
            <SelectItem value="1d" className="text-white hover:bg-gray-700">1 Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Crypto List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="p-4 lg:p-6 border-b border-gray-700">
              <h3 className="text-base lg:text-lg font-semibold text-white">Cryptocurrencies</h3>
            </div>
            <div className="p-0">
              <div className="max-h-80 lg:max-h-96 overflow-y-auto">
                {isLoadingMarket ? (
                  <div className="p-4 text-center text-white/60">Loading markets...</div>
                ) : filteredCryptos.length === 0 ? (
                  <div className="p-4 text-center text-white/60">No cryptocurrencies found</div>
                ) : (
                  filteredCryptos.map((ticker) => (
                    <button
                      key={ticker.symbol}
                      onClick={() => setSelectedSymbol(ticker.symbol)}
                      className={`w-full p-3 text-left hover:bg-gray-700 border-b border-gray-600 transition-colors ${
                        selectedSymbol === ticker.symbol ? 'bg-blue-600/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm text-white">{ticker.symbol}</div>
                          <div className="text-xs text-white/60">${formatPrice(ticker.last)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs flex items-center ${
                            ticker.percentage >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {ticker.percentage >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {ticker.percentage.toFixed(2)}%
                          </div>
                          <div className="text-xs text-white/60">
                            Vol: {formatVolume(ticker.volume)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chart and Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price Stats */}
          {selectedTicker ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-white/60">Current Price</p>
                    <p className="text-lg font-bold text-white">${formatPrice(selectedTicker.last)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
                <div className="flex items-center space-x-2">
                  {selectedTicker.percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-white/60">24h Change</p>
                    <p className={`text-lg font-bold ${
                      selectedTicker.percentage >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedTicker.percentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
                <div>
                  <p className="text-sm text-white/60">24h High</p>
                  <p className="text-lg font-bold text-green-400">${formatPrice(selectedTicker.high)}</p>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
                <div>
                  <p className="text-sm text-white/60">24h Low</p>
                  <p className="text-lg font-bold text-red-400">${formatPrice(selectedTicker.low)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center text-white">
              <p className="text-white/60">Select a cryptocurrency from the list to view its price chart and details</p>
            </div>
          )}

          {/* Price Chart */}
          {selectedTicker && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="p-6 border-b border-gray-700">
              <h3 className="flex items-center justify-between text-white text-lg font-semibold">
                <span>{selectedSymbol} Price Chart</span>
                <Badge variant="secondary" className="bg-gray-700 text-white">{timeframe.toUpperCase()}</Badge>
              </h3>
            </div>
            <div className="p-6">
              <CoinGeckoStyleChart
                symbol={selectedSymbol}
                exchange={selectedExchange}
                className="w-full"
              />
            </div>
          </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}