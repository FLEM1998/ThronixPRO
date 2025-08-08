import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTitle } from '@/hooks/useTitle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import OrderBook from '@/components/order-book';
import TradeHistory from '@/components/trade-history';
import AdvancedOrders from '@/components/advanced-orders';
import PortfolioAnalytics from '@/components/portfolio-analytics';

import TradingChart from '@/components/trading-chart';
import RiskManagementPanel from '@/components/risk-management-panel';
import ExchangeConnectionStatus from '@/components/exchange-connection-status';
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Target,
  DollarSign,
  AlertTriangle,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function AdvancedTrading() {
  useTitle("ThronixPRO - Advanced Trading Platform");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // Removed paper trading mode - live trading only
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedExchange, setSelectedExchange] = useState('kucoin');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');

  const symbols = [
    'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT', 'SOL/USDT',
    'MATIC/USDT', 'LINK/USDT', 'AVAX/USDT', 'UNI/USDT', 'ATOM/USDT'
  ];

  const exchanges = [
    { value: 'kucoin', label: 'KuCoin' },
    { value: 'bybit', label: 'Bybit' },
    { value: 'binance', label: 'Binance' }
  ];

  // Calculate estimated total and fee
  const estTotal = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '--';
  const estFee = quantity && price ? (parseFloat(quantity) * parseFloat(price) * 0.001).toFixed(4) : '--';

  // Trading mutation
  const tradeMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('POST', '/api/trading/order', orderData);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Order Placed Successfully",
        description: `${variables.side.toUpperCase()} order for ${variables.quantity} ${selectedSymbol} has been executed.`,
      });
      setQuantity('');
      setPrice('');
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTrade = (side: 'buy' | 'sell', type: 'market' | 'limit') => {
    if (!quantity) {
      toast({
        title: "Error",
        description: "Please enter a quantity",
        variant: "destructive",
      });
      return;
    }

    if (type === 'limit' && !price) {
      toast({
        title: "Error", 
        description: "Please enter a price for limit orders",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      symbol: selectedSymbol,
      side,
      type,
      quantity: parseFloat(quantity),
      price: type === 'limit' ? parseFloat(price) : undefined,
      paperTrade: false, // Live trading only
    };

    tradeMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">


        {/* Exchange Connection Status */}
        <ExchangeConnectionStatus className="mb-6" />

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Button
                  onClick={() => setLocation('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="mr-2 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="leading-tight">Advanced Trading Platform</span>
                </h1>
              </div>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed ml-10 sm:ml-12">
                Professional-grade cryptocurrency trading with advanced order types, analytics, and risk management
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800 text-xs sm:text-sm whitespace-nowrap">
                <Activity className="w-3 h-3 mr-1" />
                Live Market Data
              </Badge>
              <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800 text-xs sm:text-sm whitespace-nowrap">
                <DollarSign className="w-3 h-3 mr-1" />
                Real Money Trading
              </Badge>
            </div>
          </div>

          {/* Trading Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400 whitespace-nowrap">Symbol:</label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {symbols.map(symbol => (
                        <SelectItem key={symbol} value={symbol} className="text-white hover:bg-gray-700">
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400 whitespace-nowrap">Exchange:</label>
                  <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                    <SelectTrigger className="w-full sm:w-32 bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {exchanges.map(exchange => (
                        <SelectItem key={exchange.value} value={exchange.value} className="text-white hover:bg-gray-700">
                          {exchange.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Real money trading only - no paper trading mode */}
              <div className="flex items-center justify-end">
                <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800 text-xs sm:text-sm">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Live Trading Only
                </Badge>
              </div>
            </div>
          </div>

          {/* Risk Warning for Live Trading */}
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Live Trading Active</span>
            </div>
            <div className="text-sm text-red-300 mt-1">
              You are trading with real money. All orders will be executed on live exchanges with actual funds. 
              Please ensure proper risk management and position sizing.
            </div>
          </div>
        </div>

        {/* Main Trading Interface */}
        <Tabs defaultValue="professional" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-gray-800 border border-gray-700 h-auto min-h-[3rem]">
            <TabsTrigger 
              value="professional" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Pro Trading</span>
              <span className="sm:hidden">Pro</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orderbook" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Order Book</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Advanced Orders</span>
              <span className="sm:hidden">Advanced</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Trade History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Professional Trading Tab - Full Advanced Features */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Professional Trading Chart - Full Width */}
              <div className="xl:col-span-4">
                <TradingChart 
                  symbol={selectedSymbol}
                />
              </div>
              
              {/* Order Book and Risk Management */}
              <div className="xl:col-span-2 space-y-6">
                <OrderBook symbol={selectedSymbol} exchange={selectedExchange} />
                <RiskManagementPanel />
              </div>
              
              {/* Advanced Orders and Portfolio Analytics */}
              <div className="xl:col-span-2 space-y-6">
                <AdvancedOrders symbol={selectedSymbol} />
                <PortfolioAnalytics />
              </div>
              
              {/* Trade History - Full Width */}
              <div className="xl:col-span-4">
                <TradeHistory symbol={selectedSymbol} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orderbook" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Book */}
              <OrderBook 
                symbol={selectedSymbol} 
                exchange={selectedExchange} 
              />

              {/* Quick Trading Panel */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Quick Trade - {selectedSymbol}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleTrade('buy', 'market')}
                      disabled={tradeMutation.isPending}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {tradeMutation.isPending ? 'Processing...' : 'Market Buy'}
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleTrade('sell', 'market')}
                      disabled={tradeMutation.isPending}
                    >
                      <TrendingUp className="w-4 h-4 mr-2 rotate-180" />
                      {tradeMutation.isPending ? 'Processing...' : 'Market Sell'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.00000001"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Price (USDT)</label>
                      <Input
                        placeholder="Market Price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900/50 rounded">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Est. Total:</span>
                      <span className="text-white">{estTotal} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fee (0.1%):</span>
                      <span className="text-white">{estFee} USDT</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleTrade('buy', 'limit')}
                    disabled={tradeMutation.isPending}
                  >
                    {tradeMutation.isPending ? 'Processing...' : 'Place Limit Order'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <AdvancedOrders 
              symbol={selectedSymbol}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <TradeHistory 
              userId={user?.id}
              symbol={selectedSymbol}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PortfolioAnalytics />
          </TabsContent>
        </Tabs>

        {/* Trading Tips */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Professional Trading Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-900/50 rounded">
              <div className="font-medium text-green-400 mb-1">Risk Management</div>
              <div className="text-gray-300">Never risk more than 2% of your portfolio per trade</div>
            </div>
            <div className="p-3 bg-gray-900/50 rounded">
              <div className="font-medium text-blue-400 mb-1">OCO Orders</div>
              <div className="text-gray-300">Use One-Cancels-Other orders to automate profit taking and stop losses</div>
            </div>
            <div className="p-3 bg-gray-900/50 rounded">
              <div className="font-medium text-purple-400 mb-1">Iceberg Orders</div>
              <div className="text-gray-300">Hide large orders by only showing small portions in the order book</div>
            </div>
            <div className="p-3 bg-gray-900/50 rounded">
              <div className="font-medium text-yellow-400 mb-1">Portfolio Analytics</div>
              <div className="text-gray-300">Monitor Sharpe ratio and maximum drawdown for performance insights</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}