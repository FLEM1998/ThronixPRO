import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const orderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT']),
  quantity: z.number().min(0.000001, 'Quantity must be greater than 0'),
  price: z.number().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

interface Balance {
  available: string;
  locked: string;
}

interface ExchangeBalance {
  exchange: string;
  testnet: boolean;
  balances: Record<string, Balance>;
  totalUSD: string;
}

export default function LiveTradingPanel() {
  const [selectedSide, setSelectedSide] = useState<'BUY' | 'SELL'>('BUY');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    },
  });

  // Force valid symbol if invalid one is selected
  const currentSymbol = form.watch('symbol');
  React.useEffect(() => {
    if (currentSymbol && (currentSymbol === 'A/ETH' || currentSymbol === 'B/BTC' || currentSymbol === 'C/USDT' || currentSymbol === 'D/ETH' || currentSymbol === 'BNB/USDT')) {
      console.log('Detected invalid/unavailable trading pair, forcing to BTC/USDT');
      form.setValue('symbol', 'BTC/USDT');
    }
  }, [currentSymbol, form]);

  const { data: balance, isLoading: balanceLoading } = useQuery<ExchangeBalance>({
    queryKey: ['/api/exchange/balance'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: marketData } = useQuery({
    queryKey: ['/api/market/overview'],
    refetchInterval: 2000,
  });

  // Fetch live trading pairs from all exchanges
  const { data: tradingPairs } = useQuery({
    queryKey: ['/api/trading-pairs'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      const response = await apiRequest('POST', '/api/exchange/order', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Order Placed Successfully',
        description: `${data.side} ${data.quantity} ${data.symbol} at ${data.executedPrice}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exchange/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-alerts'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    placeOrderMutation.mutate({ ...data, side: selectedSide });
  };

  // Get current price for selected symbol
  const selectedSymbol = form.watch('symbol');
  
  // Validate selected symbol - only fetch price for valid trading pairs available on KuCoin
  const isValidSymbol = selectedSymbol && 
    (selectedSymbol.includes('/USDT') || selectedSymbol.includes('/BTC') || selectedSymbol.includes('/ETH')) &&
    selectedSymbol !== 'A/ETH' && selectedSymbol !== 'B/BTC' && selectedSymbol !== 'C/USDT' && selectedSymbol !== 'D/ETH' &&
    selectedSymbol !== 'BNB/USDT'; // BNB not available on KuCoin
    
  const { data: symbolPrice, isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ['/api/market/price', selectedSymbol],
    queryFn: async () => {
      if (!isValidSymbol) return null;
      try {
        console.log(`Fetching price for valid symbol: ${selectedSymbol}`);
        const response = await fetch(`/api/market/price/${encodeURIComponent(selectedSymbol)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Price data received for ${selectedSymbol}:`, data);
        return data;
      } catch (error) {
        console.error(`Error fetching price for ${selectedSymbol}:`, error);
        throw error;
      }
    },
    refetchInterval: 5000, // Update every 5 seconds
    enabled: !!isValidSymbol
  });

  const calculateTotal = () => {
    const quantity = form.watch('quantity');
    const price = form.watch('price');
    const currentPrice = symbolPrice?.price;
    
    if (quantity && (price || currentPrice)) {
      return (quantity * (price || currentPrice)).toFixed(8);
    }
    return '0.00000000';
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Balance Section */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Live Exchange Balance
              <Badge className="bg-orange-600 text-white text-xs ml-2">Real Money</Badge>
            </CardTitle>
            <CardDescription>
              {balance ? (
                <div className="flex items-center gap-2">
                  <Badge variant={balance.testnet ? "secondary" : "default"}>
                    {balance.testnet ? "Testnet" : "Live"}
                  </Badge>
                  <span className="capitalize">{balance.exchange}</span>
                </div>
              ) : (
                'Connect your exchange to view your real account balance'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-center py-4 text-gray-400">Loading balance...</div>
            ) : balance ? (
              <div className="space-y-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    ${balance.totalUSD}
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Portfolio Value
                    <span className="block text-xs text-amber-400">Real Exchange Balance</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(balance.balances).map(([asset, bal]) => (
                    <div key={asset} className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="font-medium text-white">{asset}</div>
                      <div className="text-sm text-gray-300">
                        Available: {parseFloat(bal.available).toFixed(asset === 'USDT' ? 2 : 6)}
                      </div>
                      {parseFloat(bal.locked) > 0 && (
                        <div className="text-xs text-yellow-400">
                          Locked: {parseFloat(bal.locked).toFixed(asset === 'USDT' ? 2 : 6)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Connect your exchange account to view real balances and start trading.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Place Order
            </CardTitle>
            <CardDescription>
              Execute real trades with your exchange balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedSide === 'BUY' ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedSide('BUY');
                    form.setValue('side', 'BUY');
                  }}
                  className={selectedSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  BUY
                </Button>
                <Button
                  type="button"
                  variant={selectedSide === 'SELL' ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedSide('SELL');
                    form.setValue('side', 'SELL');
                  }}
                  className={selectedSide === 'SELL' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  SELL
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-gray-200">Trading Pair</Label>
                <Select 
                  value={form.watch('symbol')} 
                  onValueChange={(value) => {
                    // Only allow valid trading pairs available on KuCoin
                    if (value && (value.includes('/USDT') || value.includes('/BTC') || value.includes('/ETH')) && 
                        value !== 'A/ETH' && value !== 'B/BTC' && value !== 'C/USDT' && value !== 'D/ETH' && value !== 'BNB/USDT') {
                      form.setValue('symbol', value);
                      console.log(`Selected valid trading pair: ${value}`);
                    }
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select trading pair" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 max-h-60 overflow-y-auto">
                    {/* ONLY verified working pairs from KuCoin exchange */}
                    <SelectItem value="BTC/USDT" className="text-white hover:bg-gray-700">BTC/USDT</SelectItem>
                    <SelectItem value="ETH/USDT" className="text-white hover:bg-gray-700">ETH/USDT</SelectItem>
                    <SelectItem value="SOL/USDT" className="text-white hover:bg-gray-700">SOL/USDT</SelectItem>
                    <SelectItem value="ADA/USDT" className="text-white hover:bg-gray-700">ADA/USDT</SelectItem>
                    <SelectItem value="DOT/USDT" className="text-white hover:bg-gray-700">DOT/USDT</SelectItem>
                    <SelectItem value="LINK/USDT" className="text-white hover:bg-gray-700">LINK/USDT</SelectItem>
                    <SelectItem value="LTC/USDT" className="text-white hover:bg-gray-700">LTC/USDT</SelectItem>
                    <SelectItem value="XRP/USDT" className="text-white hover:bg-gray-700">XRP/USDT</SelectItem>
                    <SelectItem value="AAVE/USDT" className="text-white hover:bg-gray-700">AAVE/USDT</SelectItem>
                    <SelectItem value="UNI/USDT" className="text-white hover:bg-gray-700">UNI/USDT</SelectItem>
                    <SelectItem value="AVAX/USDT" className="text-white hover:bg-gray-700">AVAX/USDT</SelectItem>
                    <SelectItem value="MATIC/USDT" className="text-white hover:bg-gray-700">MATIC/USDT</SelectItem>
                    <SelectItem value="ATOM/USDT" className="text-white hover:bg-gray-700">ATOM/USDT</SelectItem>
                    <SelectItem value="FTM/USDT" className="text-white hover:bg-gray-700">FTM/USDT</SelectItem>
                    <SelectItem value="NEAR/USDT" className="text-white hover:bg-gray-700">NEAR/USDT</SelectItem>
                    <SelectItem value="ALGO/USDT" className="text-white hover:bg-gray-700">ALGO/USDT</SelectItem>
                    <SelectItem value="VET/USDT" className="text-white hover:bg-gray-700">VET/USDT</SelectItem>
                    <SelectItem value="HBAR/USDT" className="text-white hover:bg-gray-700">HBAR/USDT</SelectItem>
                    <SelectItem value="TRX/USDT" className="text-white hover:bg-gray-700">TRX/USDT</SelectItem>
                    <SelectItem value="SAND/USDT" className="text-white hover:bg-gray-700">SAND/USDT</SelectItem>
                    <SelectItem value="MANA/USDT" className="text-white hover:bg-gray-700">MANA/USDT</SelectItem>
                    <SelectItem value="CRV/USDT" className="text-white hover:bg-gray-700">CRV/USDT</SelectItem>
                    <SelectItem value="SUSHI/USDT" className="text-white hover:bg-gray-700">SUSHI/USDT</SelectItem>
                    <SelectItem value="1INCH/USDT" className="text-white hover:bg-gray-700">1INCH/USDT</SelectItem>
                    
                    {/* Additional pairs from live KuCoin API if available */}
                    {(tradingPairs as any)?.pairs && Array.isArray((tradingPairs as any).pairs) ? (
                      (tradingPairs as any).pairs.slice(0, 20).map((pair: string, index: number) => {
                        const isAlreadyListed = [
                          'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT', 
                          'LINK/USDT', 'LTC/USDT', 'XRP/USDT', 'AAVE/USDT', 'UNI/USDT',
                          'AVAX/USDT', 'MATIC/USDT', 'ATOM/USDT', 'FTM/USDT', 'NEAR/USDT',
                          'ALGO/USDT', 'VET/USDT', 'HBAR/USDT', 'TRX/USDT', 'SAND/USDT',
                          'MANA/USDT', 'CRV/USDT', 'SUSHI/USDT', '1INCH/USDT'
                        ].includes(pair);
                        return !isAlreadyListed && (
                          <SelectItem key={`${pair}-${index}`} value={pair} className="text-white hover:bg-gray-700">
                            {pair}
                          </SelectItem>
                        );
                      })
                    ) : null}
                  </SelectContent>
                </Select>
                {form.formState.errors.symbol && (
                  <p className="text-red-400 text-sm">{form.formState.errors.symbol.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-200">Order Type</Label>
                <select
                  {...form.register('type')}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                >
                  <option value="MARKET">Market Order</option>
                  <option value="LIMIT">Limit Order</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-gray-200">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.000001"
                  {...form.register('quantity', { valueAsNumber: true })}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="0.001"
                />
                {form.formState.errors.quantity && (
                  <p className="text-red-400 text-sm">{form.formState.errors.quantity.message}</p>
                )}
              </div>

              {form.watch('type') === 'LIMIT' && (
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-200">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register('price', { valueAsNumber: true })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="47000.00"
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-400 text-sm">{form.formState.errors.price.message}</p>
                  )}
                </div>
              )}

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white">
                    {priceLoading ? (
                      <span className="text-yellow-400">Loading...</span>
                    ) : priceError || !isValidSymbol ? (
                      <span className="text-red-400">Invalid Pair</span>
                    ) : symbolPrice?.price ? (
                      `$${symbolPrice.price.toFixed(8)}`
                    ) : (
                      <span className="text-gray-500">---</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-medium">
                    ${calculateTotal()} USDT
                  </span>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/20 rounded p-2 mb-3">
                <p className="text-xs text-amber-400 text-center">
                  ⚠️ This will place a real order on the live market using your actual exchange balance
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={placeOrderMutation.isPending || !balance}
                className={`w-full ${
                  selectedSide === 'BUY' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {placeOrderMutation.isPending 
                  ? 'Placing Order...' 
                  : `${selectedSide} ${form.watch('symbol')}`
                }
              </Button>
            </form>

            {!balance && (
              <Alert className="mt-4">
                <AlertDescription>
                  Connect your exchange account to enable live trading.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Information */}
      {(marketData as any) && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Live Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  ${(marketData as any).btc?.price?.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">BTC/USD</div>
                <div className={`text-sm ${
                  parseFloat((marketData as any).btc?.change) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat((marketData as any).btc?.change) >= 0 ? '+' : ''}{(marketData as any).btc?.change}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  ${(marketData as any).eth?.price?.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">ETH/USD</div>
                <div className={`text-sm ${
                  parseFloat((marketData as any).eth?.change) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat((marketData as any).eth?.change) >= 0 ? '+' : ''}{(marketData as any).eth?.change}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  ${(marketData as any).bnb?.price?.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">BNB/USD</div>
                <div className={`text-sm ${
                  parseFloat((marketData as any).bnb?.change) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat((marketData as any).bnb?.change) >= 0 ? '+' : ''}{(marketData as any).bnb?.change}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  ${(marketData as any).sol?.price?.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">SOL/USD</div>
                <div className={`text-sm ${
                  parseFloat((marketData as any).sol?.change) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat((marketData as any).sol?.change) >= 0 ? '+' : ''}{(marketData as any).sol?.change}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}