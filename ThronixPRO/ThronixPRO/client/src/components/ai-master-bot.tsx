import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Square, TrendingUp, Zap, Target, AlertTriangle, BarChart3, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface AIMasterBotData {
  name: string;
  symbol: string;
  exchange: string;
  amount: string;
  isActive: boolean;
}

export default function AIMasterBot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<AIMasterBotData>({
    name: "AI Master Bot",
    symbol: "BTC/USDT",
    exchange: "kucoin",
    amount: "1000",
    isActive: false,
  });

  // Get existing AI bots
  const { data: tradingBots } = useQuery({
    queryKey: ["/api/trading-bots"],
  });

  // Get API keys for validation
  const { data: apiKeys } = useQuery({
    queryKey: ["/api/api-keys"],
  });

  // Get trading pairs
  const { data: tradingPairs } = useQuery({
    queryKey: ["/api/trading-pairs", formData.exchange],
    enabled: !!formData.exchange,
  });

  // Get AI strategy recommendations
  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/strategy-recommendations", formData.symbol.replace('/', '')],
    enabled: !!formData.symbol,
  });

  // Find the AI Master Bot
  const aiMasterBot = Array.isArray(tradingBots) ? 
    tradingBots.find((bot: any) => bot.strategy === 'ai_master' || bot.aiStrategy === 'ai_master') : null;

  // Get learning insights for the AI Master Bot
  const { data: learningInsights } = useQuery({
    queryKey: ["/api/ai/learning-insights", aiMasterBot?.id],
    enabled: !!aiMasterBot?.id,
  });

  // Create/Update AI Master Bot
  const createBotMutation = useMutation({
    mutationFn: async (data: AIMasterBotData) => {
      return await apiRequest("POST", "/api/trading-bots", {
        name: data.name,
        symbol: data.symbol,
        exchange: data.exchange,
        quoteAmount: data.amount,
        strategy: "ai_master", // Special strategy that uses AI to select best approach
        aiStrategy: "ai_master",
        status: "stopped",
        
        // AI Master Bot uses optimal settings for all strategies
        confidenceThreshold: "0.75",
        learningMode: true,
        marketRegime: "auto_detect",
        sentimentWeight: "0.4",
        newsImpactThreshold: "0.6",
        adaptationSpeed: "medium",
        profitTargetMode: "balanced",
        aiRiskMultiplier: "1.2",
        
        // Risk management
        stopLoss: "3",
        takeProfit: "8",
        maxDrawdown: "15",
        riskPerTrade: "2.5",
        
        // Grid trading parameters
        gridLevels: 10,
        gridSpacing: "0.5",
        
        // DCA parameters
        dcaOrderCount: 5,
        dcaStepPercent: "2.0",
        dcaVolumeScale: "1.5",
        
        // Technical analysis
        rsiPeriod: 14,
        rsiOverbought: "70",
        rsiOversold: "30",
        timeframe: "15m",
        
        // Execution
        executionType: "market",
        slippageTolerance: "0.1",
        maxActiveOrders: 5,
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Master Bot Created!",
        description: "Your intelligent bot is ready to analyze markets and maximize profits.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Bot",
        description: error.message || "Failed to create AI Master Bot",
        variant: "destructive",
      });
    },
  });

  // Start/Stop Bot
  const toggleBotMutation = useMutation({
    mutationFn: async ({ botId, action }: { botId: number; action: "start" | "stop" }) => {
      return await apiRequest("PATCH", `/api/trading-bots/${botId}`, {
        status: action === "start" ? "running" : "stopped",
      });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: `Bot ${action === "start" ? "Started" : "Stopped"}!`,
        description: `AI Master Bot is now ${action === "start" ? "actively trading" : "stopped"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
      setFormData(prev => ({ ...prev, isActive: action === "start" }));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle bot status",
        variant: "destructive",
      });
    },
  });

  // Execute AI strategy
  const executeStrategyMutation = useMutation({
    mutationFn: async (botId: number) => {
      return await apiRequest("POST", `/api/ai/execute-strategy/${botId}`);
    },
    onSuccess: () => {
      toast({
        title: "AI Strategy Executed",
        description: "Bot analyzed market and executed optimal trading strategy.",
      });
    },
  });

  const handleCreateBot = () => {
    if (!formData.amount || !formData.symbol || !formData.exchange) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate exchange API key exists
    const hasApiKey = Array.isArray(apiKeys) && apiKeys.some((key: any) => key.exchange === formData.exchange);
    if (!hasApiKey) {
      toast({
        title: "Exchange Not Connected",
        description: `Please connect your ${formData.exchange} API keys first`,
        variant: "destructive",
      });
      return;
    }

    createBotMutation.mutate(formData);
  };

  const handleToggleBot = (botId: number, currentStatus: string) => {
    const action = currentStatus === "running" ? "stop" : "start";
    toggleBotMutation.mutate({ botId, action });
  };

  // Find existing AI Master Bot
  const existingBot = Array.isArray(tradingBots) 
    ? tradingBots.find((bot: any) => bot.strategy === "ai_master" || bot.aiStrategy === "ai_master")
    : null;

  return (
    <div className="space-y-6">
      {/* AI Master Bot Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Master Bot
            <Badge variant="secondary" className="bg-green-100 text-green-800">Live Trading</Badge>
          </CardTitle>
          <CardDescription>
            Intelligent bot that automatically selects the best trading strategies using advanced AI analysis.
            It decides between grid trading, DCA, momentum, scalping, and sentiment trading based on market conditions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Real Money Trading</p>
                <p className="text-sm text-yellow-700">
                  This bot trades with your actual exchange funds using live market data and AI analysis.
                </p>
              </div>
            </div>
          </div>

          {!existingBot ? (
            /* Create New Bot */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exchange">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value) => setFormData(prev => ({ ...prev, exchange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kucoin">KuCoin</SelectItem>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="bybit">Bybit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="symbol">Crypto Pair</Label>
                  <Select value={formData.symbol} onValueChange={(value) => setFormData(prev => ({ ...prev, symbol: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(tradingPairs) && tradingPairs.length > 0 ? (
                        tradingPairs.slice(0, 20).map((pair: string) => (
                          <SelectItem key={pair} value={pair}>
                            {pair}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                          <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                          <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Investment Amount (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000"
                  min="10"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum: $10 USDT. Bot will use risk management to protect your capital.
                </p>
              </div>

              <Button 
                onClick={handleCreateBot}
                className="w-full"
                disabled={createBotMutation.isPending}
              >
                {createBotMutation.isPending ? "Creating AI Bot..." : "Create AI Master Bot"}
              </Button>
            </div>
          ) : (
            /* Control Existing Bot */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Bot Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Symbol:</span>
                    <span className="ml-2 font-medium">{existingBot.symbol}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">${existingBot.quoteAmount} USDT</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Exchange:</span>
                    <span className="ml-2 font-medium capitalize">{existingBot.exchange}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">P&L:</span>
                    <span className={`ml-2 font-medium ${parseFloat(existingBot.pnl || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(existingBot.pnl || '0') >= 0 ? '+' : ''}${existingBot.pnl || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simple Controls */}
              <div className="flex gap-4">
                <Button
                  onClick={() => handleToggleBot(existingBot.id, existingBot.status)}
                  className={`flex-1 ${existingBot.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  disabled={toggleBotMutation.isPending}
                >
                  {existingBot.status === 'running' ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Bot
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Bot
                    </>
                  )}
                </Button>

                {existingBot.status === 'running' && (
                  <Button
                    onClick={() => executeStrategyMutation.mutate(existingBot.id)}
                    variant="outline"
                    disabled={executeStrategyMutation.isPending}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Execute AI Trade
                  </Button>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Current Status:</strong> {existingBot.status === 'running' ? 'Bot is actively analyzing markets and trading' : 'Bot is stopped'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Strategy Recommendations */}
      {recommendations && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Strategy Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.strategies?.slice(0, 3).map((strategy: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{strategy.name}</h4>
                    <p className="text-sm text-gray-600">{strategy.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {(strategy.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <p className="text-sm text-green-600 font-medium">{strategy.expectedReturn}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Learning Insights */}
      {aiMasterBot && learningInsights && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Learning Performance
            </CardTitle>
            <CardDescription>
              Real-time learning insights from your AI Master Bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Win Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {learningInsights.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(learningInsights.winRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Profit</span>
                  <span className={`text-lg font-bold ${learningInsights.averageProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${learningInsights.averageProfit.toFixed(2)}
                  </span>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  {learningInsights.bestStrategy.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {learningInsights.improvementSuggestions && learningInsights.improvementSuggestions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  AI Improvement Suggestions
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {learningInsights.improvementSuggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-xs">
                AI continuously learns from each trade to maximize your profits
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}