import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Target, Shield, TrendingUp, Grid3X3, DollarSign } from "lucide-react";

const advancedBotSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  symbol: z.string().min(1, "Trading pair is required"),
  strategy: z.string().min(1, "Strategy is required"),
  exchange: z.string().min(1, "Exchange is required"),
  quoteAmount: z.string().min(1, "Quote amount is required"),
  
  // Risk Management
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  trailingStopPercent: z.string().optional(),
  maxDrawdown: z.string().optional(),
  riskPerTrade: z.string().optional(),
  maxActiveOrders: z.string().optional(),
  
  // Grid Trading
  gridLevels: z.string().optional(),
  gridSpacing: z.string().optional(),
  gridUpperBound: z.string().optional(),
  gridLowerBound: z.string().optional(),
  
  // DCA Parameters
  dcaOrderCount: z.string().optional(),
  dcaStepPercent: z.string().optional(),
  dcaVolumeScale: z.string().optional(),
  
  // Technical Analysis
  rsiPeriod: z.string().optional(),
  rsiOverbought: z.string().optional(),
  rsiOversold: z.string().optional(),
  timeframe: z.string().optional(),
  
  // Execution
  executionType: z.string().optional(),
  slippageTolerance: z.string().optional(),
});

type AdvancedBotForm = z.infer<typeof advancedBotSchema>;

interface AdvancedBotCreatorProps {
  onClose: () => void;
  onNavigateToExchange?: () => void;
}

export default function AdvancedBotCreator({ onClose, onNavigateToExchange }: AdvancedBotCreatorProps) {
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("AdvancedBotCreator component rendering...");

  const form = useForm<AdvancedBotForm>({
    resolver: zodResolver(advancedBotSchema),
    defaultValues: {
      name: "",
      symbol: "",
      strategy: "dca",
      exchange: "",
      quoteAmount: "",
      executionType: "limit",
      timeframe: "1h",
      rsiPeriod: "14",
      rsiOverbought: "70",
      rsiOversold: "30",
      maxActiveOrders: "5",
      slippageTolerance: "0.5",
    },
  });

  // Fetch trading pairs for selected exchange
  const { data: tradingPairs = { pairs: [] } } = useQuery({
    queryKey: ['/api/exchange', selectedExchange, 'pairs'],
    enabled: !!selectedExchange,
  });

  // Fetch user's connected exchanges
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['/api/exchange/api-keys'],
  });

  const safeApiKeys = Array.isArray(apiKeys) ? apiKeys : [];
  const safeTradingPairs = tradingPairs?.pairs && Array.isArray(tradingPairs.pairs) ? tradingPairs.pairs : [];

  const createBotMutation = useMutation({
    mutationFn: async (data: AdvancedBotForm) => {
      const response = await apiRequest("POST", "/api/trading-bots", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Advanced trading bot created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trading bot",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdvancedBotForm) => {
    console.log("Advanced bot form submission data:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Convert data types correctly: integer fields to numbers, decimal fields to strings
    const processedData = {
      ...data,
      // Integer fields - convert to numbers (or undefined if empty)
      maxActiveOrders: data.maxActiveOrders ? parseInt(data.maxActiveOrders) : undefined,
      gridLevels: data.gridLevels ? parseInt(data.gridLevels) : undefined,
      dcaOrderCount: data.dcaOrderCount ? parseInt(data.dcaOrderCount) : undefined,
      rsiPeriod: data.rsiPeriod ? parseInt(data.rsiPeriod) : undefined,
      
      // Decimal fields - keep as strings (or undefined if empty)
      stopLoss: data.stopLoss?.trim() || undefined,
      takeProfit: data.takeProfit?.trim() || undefined,
      trailingStopPercent: data.trailingStopPercent?.trim() || undefined,
      maxDrawdown: data.maxDrawdown?.trim() || undefined,
      riskPerTrade: data.riskPerTrade?.trim() || undefined,
      
      gridSpacing: data.gridSpacing?.trim() || undefined,
      gridUpperBound: data.gridUpperBound?.trim() || undefined,
      gridLowerBound: data.gridLowerBound?.trim() || undefined,
      
      dcaStepPercent: data.dcaStepPercent?.trim() || undefined,
      dcaVolumeScale: data.dcaVolumeScale?.trim() || undefined,
      
      rsiOverbought: data.rsiOverbought?.trim() || undefined,
      rsiOversold: data.rsiOversold?.trim() || undefined,
      
      slippageTolerance: data.slippageTolerance?.trim() || undefined,
      
      // Text fields - keep as strings
      timeframe: data.timeframe?.trim() || undefined,
      executionType: data.executionType?.trim() || undefined,
    };
    
    console.log("Processed data being sent:", processedData);
    createBotMutation.mutate(processedData as any);
  };

  const strategies = [
    { value: "dca", label: "Dollar Cost Averaging", icon: DollarSign },
    { value: "grid", label: "Grid Trading", icon: Grid3X3 },
    { value: "momentum", label: "Momentum Trading", icon: TrendingUp },
    { value: "scalping", label: "Scalping", icon: Target },
    { value: "arbitrage", label: "Arbitrage", icon: Shield },
  ];

  const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
  const executionTypes = ["market", "limit", "stop_limit"];

  return (
    <Card className="w-full max-w-4xl max-h-[90vh] mx-auto bg-gray-900/95 border-gray-700 flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 mr-2"
            >
              ← Back
            </Button>
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl text-white">Advanced Bot Creator</CardTitle>
            <Badge className="bg-orange-600 text-white text-xs">Real Money</Badge>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Exchange Connection Notice */}
        {safeApiKeys.length === 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-orange-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-orange-400 font-medium text-sm mb-1">Connect Real Exchange Required</h4>
                <p className="text-orange-200 text-sm mb-3">
                  Advanced trading bots require live exchange API connections to trade with your real funds. 
                  Connect your exchange API keys to enable live trading with actual cryptocurrency balances.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    if (onNavigateToExchange) {
                      onNavigateToExchange();
                      onClose();
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2"
                  size="sm"
                >
                  🔑 Connect Exchange API Keys
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={(e) => {
          console.log("Form submit event triggered");
          form.handleSubmit(onSubmit)(e);
        }} className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Bot Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="My Advanced Bot"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange" className="text-white">Exchange</Label>
              <Select
                value={form.watch("exchange")}
                onValueChange={(value) => {
                  form.setValue("exchange", value);
                  setSelectedExchange(value);
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {/* Connected exchanges from user's API keys */}
                  {safeApiKeys.map((key: any) => (
                    <SelectItem key={key.id} value={key.exchange} className="text-white">
                      {key.exchange.toUpperCase()} {key.testnet ? "(Testnet)" : "(Live)"}
                    </SelectItem>
                  ))}
                  
                  {/* Default exchanges for testing when no API keys connected */}
                  {safeApiKeys.length === 0 && (
                    <>
                      <SelectItem value="binance" className="text-white">Binance (Live Trading)</SelectItem>
                      <SelectItem value="kucoin" className="text-white">KuCoin (Live Trading)</SelectItem>
                      <SelectItem value="bybit" className="text-white">Bybit (Live Trading)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {safeApiKeys.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-red-400">
                    Live exchange API keys required - No demo trading available
                  </p>
                  {selectedExchange === 'binance' && (
                    <p className="text-xs text-yellow-400">
                      Note: Binance may be restricted in some regions. KuCoin and Bybit are recommended alternatives.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-white">Trading Pair</Label>
              <Select
                value={form.watch("symbol")}
                onValueChange={(value) => form.setValue("symbol", value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 max-h-60 overflow-y-auto">
                  {/* Live trading pairs from connected exchanges */}
                  {safeTradingPairs.map((pair: string) => (
                    <SelectItem key={pair} value={pair} className="text-white">
                      {pair}
                    </SelectItem>
                  ))}
                  
                  {/* Popular trading pairs fallback */}
                  {safeTradingPairs.length === 0 && (
                    <>
                      <SelectItem value="BTCUSDT" className="text-white">BTC/USDT</SelectItem>
                      <SelectItem value="ETHUSDT" className="text-white">ETH/USDT</SelectItem>
                      <SelectItem value="BNBUSDT" className="text-white">BNB/USDT</SelectItem>
                      <SelectItem value="ADAUSDT" className="text-white">ADA/USDT</SelectItem>
                      <SelectItem value="SOLUSDT" className="text-white">SOL/USDT</SelectItem>
                      <SelectItem value="XRPUSDT" className="text-white">XRP/USDT</SelectItem>
                      <SelectItem value="DOTUSDT" className="text-white">DOT/USDT</SelectItem>
                      <SelectItem value="LINKUSDT" className="text-white">LINK/USDT</SelectItem>
                      <SelectItem value="LTCUSDT" className="text-white">LTC/USDT</SelectItem>
                      <SelectItem value="BCHUSDT" className="text-white">BCH/USDT</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {safeTradingPairs.length === 0 && (
                <p className="text-xs text-yellow-400">
                  Showing popular pairs - connect exchange for full selection
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quoteAmount" className="text-white">Quote Amount (USD)</Label>
              <Input
                id="quoteAmount"
                {...form.register("quoteAmount")}
                placeholder="100.00"
                type="number"
                step="0.01"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Strategy Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trading Strategy
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {strategies.map((strategy) => {
                const Icon = strategy.icon;
                const isSelected = form.watch("strategy") === strategy.value;
                return (
                  <Button
                    key={strategy.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`p-4 h-auto flex flex-col items-center gap-2 ${
                      isSelected 
                        ? "bg-primary text-white" 
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => form.setValue("strategy", strategy.value)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center">{strategy.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="my-6">
            <Separator className="bg-gray-700" />
          </div>

          {/* Advanced Parameters */}
          <Tabs defaultValue="risk" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
              <TabsTrigger value="risk" className="text-white text-xs">Risk</TabsTrigger>
              <TabsTrigger value="strategy-params" className="text-white text-xs">Strategy</TabsTrigger>
              <TabsTrigger value="technical" className="text-white text-xs">Technical</TabsTrigger>
              <TabsTrigger value="execution" className="text-white text-xs">Execution</TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss" className="text-white">Stop Loss Price</Label>
                  <Input
                    id="stopLoss"
                    {...form.register("stopLoss")}
                    placeholder="40000.00"
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeProfit" className="text-white">Take Profit Price</Label>
                  <Input
                    id="takeProfit"
                    {...form.register("takeProfit")}
                    placeholder="50000.00"
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailingStopPercent" className="text-white">Trailing Stop %</Label>
                  <Input
                    id="trailingStopPercent"
                    {...form.register("trailingStopPercent")}
                    placeholder="5.0"
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDrawdown" className="text-white">Max Drawdown %</Label>
                  <Input
                    id="maxDrawdown"
                    {...form.register("maxDrawdown")}
                    placeholder="10.0"
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskPerTrade" className="text-white">Risk Per Trade %</Label>
                  <Input
                    id="riskPerTrade"
                    {...form.register("riskPerTrade")}
                    placeholder="2.0"
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxActiveOrders" className="text-white">Max Active Orders</Label>
                  <Input
                    id="maxActiveOrders"
                    {...form.register("maxActiveOrders")}
                    placeholder="5"
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="strategy-params" className="space-y-4 mt-4">
              {form.watch("strategy") === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gridLevels" className="text-white">Grid Levels</Label>
                    <Input
                      id="gridLevels"
                      {...form.register("gridLevels")}
                      placeholder="10"
                      type="number"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gridSpacing" className="text-white">Grid Spacing %</Label>
                    <Input
                      id="gridSpacing"
                      {...form.register("gridSpacing")}
                      placeholder="1.0"
                      type="number"
                      step="0.1"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gridUpperBound" className="text-white">Upper Bound Price</Label>
                    <Input
                      id="gridUpperBound"
                      {...form.register("gridUpperBound")}
                      placeholder="50000.00"
                      type="number"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gridLowerBound" className="text-white">Lower Bound Price</Label>
                    <Input
                      id="gridLowerBound"
                      {...form.register("gridLowerBound")}
                      placeholder="40000.00"
                      type="number"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}

              {form.watch("strategy") === "dca" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dcaOrderCount" className="text-white">DCA Order Count</Label>
                    <Input
                      id="dcaOrderCount"
                      {...form.register("dcaOrderCount")}
                      placeholder="5"
                      type="number"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dcaStepPercent" className="text-white">DCA Step %</Label>
                    <Input
                      id="dcaStepPercent"
                      {...form.register("dcaStepPercent")}
                      placeholder="2.0"
                      type="number"
                      step="0.1"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dcaVolumeScale" className="text-white">Volume Scale Factor</Label>
                    <Input
                      id="dcaVolumeScale"
                      {...form.register("dcaVolumeScale")}
                      placeholder="1.5"
                      type="number"
                      step="0.1"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeframe" className="text-white">Timeframe</Label>
                  <Select
                    value={form.watch("timeframe")}
                    onValueChange={(value) => form.setValue("timeframe", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {timeframes.map((tf) => (
                        <SelectItem key={tf} value={tf} className="text-white">{tf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsiPeriod" className="text-white">RSI Period</Label>
                  <Input
                    id="rsiPeriod"
                    {...form.register("rsiPeriod")}
                    placeholder="14"
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsiOverbought" className="text-white">RSI Overbought</Label>
                  <Input
                    id="rsiOverbought"
                    {...form.register("rsiOverbought")}
                    placeholder="70"
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsiOversold" className="text-white">RSI Oversold</Label>
                  <Input
                    id="rsiOversold"
                    {...form.register("rsiOversold")}
                    placeholder="30"
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="execution" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="executionType" className="text-white">Execution Type</Label>
                  <Select
                    value={form.watch("executionType")}
                    onValueChange={(value) => form.setValue("executionType", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {executionTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type.replace("_", " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slippageTolerance" className="text-white">Slippage Tolerance %</Label>
                  <Input
                    id="slippageTolerance"
                    {...form.register("slippageTolerance")}
                    placeholder="0.5"
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="my-6">
            <Separator className="bg-gray-700" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 pb-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createBotMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createBotMutation.isPending ? "Creating..." : "Create Advanced Bot"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}