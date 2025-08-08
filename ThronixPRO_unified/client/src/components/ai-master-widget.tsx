import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Square, TrendingUp, DollarSign, Target, Edit3, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface AIMasterBotData {
  name: string;
  symbol: string;
  exchange: string;
  amount: string;
  isActive: boolean;
}

export default function AIMasterWidget() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<AIMasterBotData>({
    name: "AI Master Bot",
    symbol: "BTC/USDT",
    exchange: "kucoin",
    amount: "1000",
    isActive: false
  });

  // Get existing AI Master Bot
  const { data: tradingBots } = useQuery({
    queryKey: ["/api/trading-bots"],
  });

  // Get live trading pairs from all exchanges (same endpoint as other components)
  const { data: tradingPairs } = useQuery({
    queryKey: ['/api/trading-pairs'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Find the AI Master Bot
  const aiMasterBot = Array.isArray(tradingBots) ? 
    tradingBots.find((bot: any) => bot.strategy === 'ai_master' || bot.aiStrategy === 'ai_master') : null;

  // Sync form data with existing bot
  useEffect(() => {
    if (aiMasterBot && !isEditing) {
      setFormData({
        name: aiMasterBot.name || "AI Master Bot",
        symbol: aiMasterBot.symbol || "BTC/USDT",
        exchange: aiMasterBot.exchange || "kucoin",
        amount: aiMasterBot.quoteAmount || "1000",
        isActive: aiMasterBot.status === 'running'
      });
    }
  }, [aiMasterBot, isEditing]);

  // Get learning insights for the AI Master Bot
  const { data: learningInsights } = useQuery({
    queryKey: ["/api/ai/learning-insights", aiMasterBot?.id],
    enabled: !!aiMasterBot?.id,
  });

  // Get live trading positions for P&L calculation
  const { data: positions } = useQuery({
    queryKey: ["/api/positions/open"],
    refetchInterval: 5000, // Refresh every 5 seconds for live positions
  });

  // Get portfolio summary for total P&L
  const { data: portfolioSummary } = useQuery({
    queryKey: ["/api/portfolio/summary"],
    refetchInterval: 5000, // Refresh every 5 seconds for live P&L
  });

  // Create AI Master Bot
  const createBotMutation = useMutation({
    mutationFn: async (data: AIMasterBotData) => {
      return await apiRequest("POST", "/api/trading-bots", {
        name: data.name,
        symbol: data.symbol,
        exchange: data.exchange,
        quoteAmount: data.amount,
        strategy: "ai_master",
        aiStrategy: "ai_master",
        status: "stopped",
        confidenceThreshold: "0.75",
        learningMode: true,
        marketRegime: "auto_detect",
        sentimentWeight: "0.4",
        newsImpactThreshold: "0.6",
        adaptationSpeed: "medium",
        profitTargetMode: "balanced",
        aiRiskMultiplier: "1.2",
        stopLoss: "3",
        takeProfit: "8",
        maxDrawdown: "10",
        riskPerTrade: "2"
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Master Bot Created",
        description: "Your intelligent trading bot is ready to maximize profits!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create AI Master Bot",
        variant: "destructive",
      });
    },
  });

  // Update Bot Parameters
  const updateBotMutation = useMutation({
    mutationFn: async (data: AIMasterBotData) => {
      return await apiRequest("PUT", `/api/trading-bots/${aiMasterBot.id}`, {
        symbol: data.symbol,
        exchange: data.exchange,
        quoteAmount: data.amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bot Updated",
        description: "AI Master Bot parameters updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bot",
        variant: "destructive",
      });
    },
  });

  // Start/Stop Bot
  const toggleBotMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      return await apiRequest("PUT", `/api/trading-bots/${aiMasterBot.id}/${action}`);
    },
    onSuccess: (_, action) => {
      toast({
        title: `AI Master Bot ${action === "start" ? "Started" : "Stopped"}`,
        description: action === "start" 
          ? "AI is now analyzing markets and executing trades" 
          : "AI trading has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle bot",
        variant: "destructive",
      });
    },
  });

  const handleCreateBot = () => {
    createBotMutation.mutate(formData);
  };

  const handleToggleBot = () => {
    if (aiMasterBot) {
      const action = aiMasterBot.status === 'running' ? 'stop' : 'start';
      toggleBotMutation.mutate(action);
    }
  };

  // Calculate live P&L from portfolio data and AI bot positions
  const portfolioPnL = portfolioSummary?.dayPnl ? parseFloat(portfolioSummary.dayPnl) : 0;
  
  // Calculate AI bot specific P&L from positions
  const aiBotPositions = Array.isArray(positions) ? 
    positions.filter((pos: any) => pos.botId === aiMasterBot?.id) : [];
  const aiBotPnL = aiBotPositions.reduce((total: number, pos: any) => {
    return total + (pos.unrealizedPnl || 0);
  }, 0);
  
  // Use portfolio P&L if no specific bot positions, otherwise use bot-specific P&L
  const currentPnL = aiBotPnL !== 0 ? aiBotPnL : portfolioPnL;
  const winRate = learningInsights?.winRate || 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Master Bot
          <Badge variant="secondary" className="ml-auto">Real Money</Badge>
        </CardTitle>
        <CardDescription>
          Advanced AI trading bot with machine learning capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiMasterBot ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amount" className="text-sm">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="exchange" className="text-sm">Exchange</Label>
                <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kucoin">KuCoin</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="symbol" className="text-sm">Crypto Pair</Label>
              <Select value={formData.symbol} onValueChange={(value) => setFormData({ ...formData, symbol: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {/* Live trading pairs from exchange */}
                  {tradingPairs?.pairs && Array.isArray(tradingPairs.pairs) ? (
                    tradingPairs.pairs.map((pair: string) => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>Loading trading pairs...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateBot} 
              disabled={createBotMutation.isPending}
              className="w-full h-9"
            >
              {createBotMutation.isPending ? "Creating..." : "Create AI Master Bot"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live P&L Display */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Live P&L</div>
                <div className={`text-lg font-bold ${currentPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Win Rate</div>
                <div className="text-lg font-bold text-blue-600">
                  {winRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Status</div>
                <Badge variant={aiMasterBot.status === 'running' ? 'default' : 'secondary'} className="text-xs">
                  {aiMasterBot.status === 'running' ? 'Active' : 'Stopped'}
                </Badge>
              </div>
            </div>

            {/* Bot Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleToggleBot}
                disabled={toggleBotMutation.isPending}
                variant={aiMasterBot.status === 'running' ? 'destructive' : 'default'}
                className="flex-1 h-9"
              >
                {toggleBotMutation.isPending ? (
                  "Processing..."
                ) : aiMasterBot.status === 'running' ? (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Stop Bot
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Start Bot
                  </>
                )}
              </Button>
            </div>

            {/* Bot Parameters - Editable */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-amount" className="text-sm">Amount (USD)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-exchange" className="text-sm">Exchange</Label>
                    <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kucoin">KuCoin</SelectItem>
                        <SelectItem value="bybit">Bybit</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-symbol" className="text-sm">Crypto Pair</Label>
                  <Select value={formData.symbol} onValueChange={(value) => setFormData({ ...formData, symbol: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {/* All live trading pairs from selected exchange */}
                      {tradingPairs?.pairs && Array.isArray(tradingPairs.pairs) ? (
                        tradingPairs.pairs.map((pair: string) => (
                          <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading trading pairs from {formData.exchange}...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateBotMutation.mutate(formData)}
                    disabled={updateBotMutation.isPending}
                    className="flex-1 h-9"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateBotMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      if (aiMasterBot) {
                        setFormData({
                          name: aiMasterBot.name || "AI Master Bot",
                          symbol: aiMasterBot.symbol || "BTC/USDT",
                          exchange: aiMasterBot.exchange || "kucoin",
                          amount: aiMasterBot.quoteAmount || "1000",
                          isActive: aiMasterBot.status === 'running'
                        });
                      }
                    }}
                    variant="outline"
                    className="h-9"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trading:</span>
                  <span className="font-medium">{aiMasterBot.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${aiMasterBot.quoteAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Exchange:</span>
                  <span className="font-medium capitalize">{aiMasterBot.exchange}</span>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 mt-2"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit Parameters
                </Button>
              </div>
            )}

            {aiMasterBot.status === 'running' && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  AI is actively analyzing markets and learning to maximize your profits
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}