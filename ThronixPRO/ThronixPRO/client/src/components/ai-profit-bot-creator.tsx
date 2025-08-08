import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain, TrendingUp, Zap, Target, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface AIProfitBotFormData {
  name: string;
  symbol: string;
  exchange: string;
  quoteAmount: string;
  aiStrategy: string;
  confidenceThreshold: number;
  learningMode: boolean;
  marketRegime: string;
  sentimentWeight: number;
  newsImpactThreshold: number;
  adaptationSpeed: string;
  profitTargetMode: string;
  aiRiskMultiplier: number;
  stopLoss: string;
  takeProfit: string;
  maxDrawdown: number;
  riskPerTrade: number;
}

export default function AIProfitBotCreator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<AIProfitBotFormData>({
    name: "",
    symbol: "",
    exchange: "",
    quoteAmount: "",
    aiStrategy: "",
    confidenceThreshold: 0.75,
    learningMode: true,
    marketRegime: "auto_detect",
    sentimentWeight: 0.3,
    newsImpactThreshold: 0.5,
    adaptationSpeed: "medium",
    profitTargetMode: "balanced",
    aiRiskMultiplier: 1.0,
    stopLoss: "",
    takeProfit: "",
    maxDrawdown: 10,
    riskPerTrade: 2,
  });

  // Get API keys for exchange validation
  const { data: apiKeys } = useQuery({
    queryKey: ["/api/api-keys"],
  });

  // Get trading pairs for selected exchange
  const { data: tradingPairs } = useQuery({
    queryKey: ["/api/trading-pairs", formData.exchange],
    enabled: !!formData.exchange,
  });

  // Create AI trading bot mutation
  const createBotMutation = useMutation({
    mutationFn: async (data: AIProfitBotFormData) => {
      return await apiRequest("POST", "/api/trading-bots", {
        ...data,
        strategy: data.aiStrategy, // Map aiStrategy to strategy field
        status: "stopped", // Start as stopped until user activates
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Profit Bot Created!",
        description: "Your intelligent trading bot is ready to generate profits.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-bots"] });
      // Reset form
      setFormData({
        name: "",
        symbol: "",
        exchange: "",
        quoteAmount: "",
        aiStrategy: "",
        confidenceThreshold: 0.75,
        learningMode: true,
        marketRegime: "auto_detect",
        sentimentWeight: 0.3,
        newsImpactThreshold: 0.5,
        adaptationSpeed: "medium",
        profitTargetMode: "balanced",
        aiRiskMultiplier: 1.0,
        stopLoss: "",
        takeProfit: "",
        maxDrawdown: 10,
        riskPerTrade: 2,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating AI Bot",
        description: error.message || "Failed to create AI trading bot",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.symbol || !formData.exchange || !formData.quoteAmount || !formData.aiStrategy) {
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

  const aiStrategies = [
    {
      id: "smart_trend",
      name: "Smart Trend Follower",
      description: "Uses machine learning to identify and follow profitable trends",
      icon: <TrendingUp className="h-4 w-4" />,
      profitPotential: "High",
      riskLevel: "Medium"
    },
    {
      id: "ml_predictor",
      name: "ML Price Predictor",
      description: "Predicts future price movements using advanced neural networks",
      icon: <Brain className="h-4 w-4" />,
      profitPotential: "Very High",
      riskLevel: "Medium-High"
    },
    {
      id: "neural_scalp",
      name: "Neural Scalper",
      description: "High-frequency AI trading for quick profit accumulation",
      icon: <Zap className="h-4 w-4" />,
      profitPotential: "High",
      riskLevel: "Low-Medium"
    },
    {
      id: "ai_momentum",
      name: "AI Momentum Hunter",
      description: "Detects momentum shifts before they happen using AI analysis",
      icon: <Target className="h-4 w-4" />,
      profitPotential: "High",
      riskLevel: "Medium"
    },
    {
      id: "sentiment_trader",
      name: "Sentiment Trader",
      description: "Trades based on real-time market sentiment and news analysis",
      icon: <Shield className="h-4 w-4" />,
      profitPotential: "Medium-High",
      riskLevel: "Medium"
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Profit Bot Creator
          <Badge variant="secondary" className="bg-green-100 text-green-800">Live Trading</Badge>
        </CardTitle>
        <CardDescription>
          Create an intelligent AI-powered trading bot designed to maximize your profits using advanced machine learning strategies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Real Money Trading</p>
              <p className="text-sm text-yellow-700">
                This AI bot will trade with your actual exchange funds. Ensure you have connected your exchange API keys and understand the risks involved.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="strategy" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="strategy">AI Strategy</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="risk">Risk Management</TabsTrigger>
              <TabsTrigger value="advanced">Advanced AI</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Bot Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My AI Profit Bot"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quoteAmount">Investment Amount (USDT)</Label>
                  <Input
                    id="quoteAmount"
                    type="number"
                    value={formData.quoteAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, quoteAmount: e.target.value }))}
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>AI Strategy Selection</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {aiStrategies.map((strategy) => (
                    <Card 
                      key={strategy.id}
                      className={`cursor-pointer transition-all ${
                        formData.aiStrategy === strategy.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, aiStrategy: strategy.id }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{strategy.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium">{strategy.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Profit: {strategy.profitPotential}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Risk: {strategy.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exchange">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value) => setFormData(prev => ({ ...prev, exchange: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="kucoin">KuCoin</SelectItem>
                      <SelectItem value="bybit">Bybit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="symbol">Trading Pair</Label>
                  <Select value={formData.symbol} onValueChange={(value) => setFormData(prev => ({ ...prev, symbol: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trading pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(tradingPairs) && tradingPairs.length > 0 ? (
                        tradingPairs.slice(0, 20).map((pair: string) => (
                          <SelectItem key={pair} value={pair}>
                            {pair}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profitTargetMode">Profit Target Mode</Label>
                  <Select value={formData.profitTargetMode} onValueChange={(value) => setFormData(prev => ({ ...prev, profitTargetMode: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative (Lower risk, steady profits)</SelectItem>
                      <SelectItem value="balanced">Balanced (Optimal risk/reward)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (Higher risk, maximum profits)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="marketRegime">Market Regime Detection</Label>
                  <Select value={formData.marketRegime} onValueChange={(value) => setFormData(prev => ({ ...prev, marketRegime: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto_detect">Auto Detect (AI determines best approach)</SelectItem>
                      <SelectItem value="trending">Trending Markets</SelectItem>
                      <SelectItem value="ranging">Ranging Markets</SelectItem>
                      <SelectItem value="volatile">Volatile Markets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={formData.stopLoss}
                    onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
                    placeholder="5"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
                    placeholder="10"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Maximum Drawdown: {formData.maxDrawdown}%</Label>
                  <Slider
                    value={[formData.maxDrawdown]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, maxDrawdown: value[0] }))}
                    max={25}
                    min={5}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Maximum portfolio loss before AI stops trading</p>
                </div>

                <div>
                  <Label>Risk Per Trade: {formData.riskPerTrade}%</Label>
                  <Slider
                    value={[formData.riskPerTrade]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, riskPerTrade: value[0] }))}
                    max={10}
                    min={0.5}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Percentage of capital risked per individual trade</p>
                </div>

                <div>
                  <Label>AI Risk Multiplier: {formData.aiRiskMultiplier.toFixed(1)}x</Label>
                  <Slider
                    value={[formData.aiRiskMultiplier]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, aiRiskMultiplier: value[0] }))}
                    max={2.0}
                    min={0.5}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">AI-based risk adjustment factor</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>AI Confidence Threshold: {(formData.confidenceThreshold * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[formData.confidenceThreshold]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                    max={0.95}
                    min={0.60}
                    step={0.05}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Minimum AI prediction confidence required to execute trades</p>
                </div>

                <div>
                  <Label>Sentiment Analysis Weight: {(formData.sentimentWeight * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[formData.sentimentWeight]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sentimentWeight: value[0] }))}
                    max={1.0}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">How much weight to give sentiment analysis in trading decisions</p>
                </div>

                <div>
                  <Label>News Impact Threshold: {(formData.newsImpactThreshold * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[formData.newsImpactThreshold]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, newsImpactThreshold: value[0] }))}
                    max={1.0}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Threshold for news impact to trigger trading actions</p>
                </div>

                <div>
                  <Label htmlFor="adaptationSpeed">AI Adaptation Speed</Label>
                  <Select value={formData.adaptationSpeed} onValueChange={(value) => setFormData(prev => ({ ...prev, adaptationSpeed: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Stable, less reactive)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced adaptation)</SelectItem>
                      <SelectItem value="fast">Fast (Quick adaptation to changes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="learningMode"
                    checked={formData.learningMode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, learningMode: !!checked }))}
                  />
                  <Label htmlFor="learningMode" className="text-sm">
                    Enable AI Learning Mode (Bot improves performance over time)
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createBotMutation.isPending}
          >
            {createBotMutation.isPending ? "Creating AI Bot..." : "Create AI Profit Bot"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}