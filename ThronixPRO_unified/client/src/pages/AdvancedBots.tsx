import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Bot, 
  Play, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Zap, 
  AlertTriangle,
  Settings,
  Activity,
  DollarSign,
  Timer,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BotPerformance {
  totalTrades: number;
  successfulTrades: number;
  successRate: number;
  totalPnl: number;
  avgExecutionTime: number;
}

interface ActiveBot {
  id: number;
  name: string;
  symbol: string;
  currentStrategy: string;
  isActive: boolean;
  createdAt: string;
}

interface TradingStrategy {
  id: number;
  name: string;
  type: string;
  description: string;
  winRate: string;
  avgPnl: string;
  riskScore: string;
  backtestResults: {
    totalTrades: number;
    winningTrades: number;
    totalReturn: number;
    maxDrawdown: number;
  };
}

interface BotLog {
  id: number;
  coin: string;
  signal: string;
  strategy: {
    type: string;
    parameters: Record<string, any>;
    confidence: number;
  };
  pnl: string;
  result: string;
  executionTime: number;
  timestamp: string;
}

interface DashboardData {
  totalBots: number;
  activeBots: number;
  totalTrades: number;
  successRate: number;
  totalPnl: string;
  avgExecutionTime: number;
  recentActivity: BotLog[];
}

export default function AdvancedBots() {
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's trading bots
  const { data: userBots, isLoading: botsLoading } = useQuery({
    queryKey: ['/api/bots'],
    retry: false,
  });

  // Fetch active bots
  const { data: activeBots, refetch: refetchActiveBots } = useQuery({
    queryKey: ['/api/ai/bots/active'],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
  });

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/ai/analytics/dashboard'],
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: false,
  });

  // Fetch available strategies
  const { data: strategies } = useQuery({
    queryKey: ['/api/ai/strategies'],
    retry: false,
  });

  // Fetch bot performance for selected bot
  const { data: botPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: [`/api/ai/bot/${selectedBot}/performance`],
    enabled: selectedBot !== null,
    refetchInterval: 5000,
    retry: false,
  });

  // Fetch bot logs for selected bot
  const { data: botLogs } = useQuery({
    queryKey: [`/api/ai/bot/${selectedBot}/logs?limit=20`],
    enabled: selectedBot !== null,
    refetchInterval: 10000,
    retry: false,
  });

  // Start bot mutation
  const startBotMutation = useMutation({
    mutationFn: async (data: { botId: number; symbol: string; riskLevel: string }) => {
      return apiRequest('/api/ai/bot/start', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "AI trading bot started successfully",
      });
      refetchActiveBots();
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Start Failed",
        description: error.message || "Failed to start bot",
        variant: "destructive",
      });
    },
  });

  // Stop bot mutation
  const stopBotMutation = useMutation({
    mutationFn: async (data: { botId: number; symbol: string }) => {
      return apiRequest('/api/ai/bot/stop', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "AI trading bot stopped successfully",
      });
      refetchActiveBots();
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Stop Failed",
        description: error.message || "Failed to stop bot",
        variant: "destructive",
      });
    },
  });

  // Emergency stop all bots mutation
  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ai/bots/emergency-stop', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Emergency Stop",
        description: "All bots stopped successfully",
      });
      refetchActiveBots();
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Emergency Stop Failed",
        description: error.message || "Failed to stop all bots",
        variant: "destructive",
      });
    },
  });

  const handleStartBot = () => {
    if (!selectedBot) {
      toast({
        title: "No Bot Selected",
        description: "Please select a bot to start",
        variant: "destructive",
      });
      return;
    }

    startBotMutation.mutate({
      botId: selectedBot,
      symbol: selectedSymbol,
      riskLevel: selectedRiskLevel
    });
  };

  const handleStopBot = (botId: number, symbol: string) => {
    stopBotMutation.mutate({ botId, symbol });
  };

  const formatPnl = (pnl: number | string) => {
    const value = typeof pnl === 'string' ? parseFloat(pnl) : pnl;
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const formatPercentage = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  if (botsLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading advanced AI bots...</div>
      </div>
    );
  }

  const dashboard: DashboardData = dashboardData || {
    totalBots: 0,
    activeBots: 0,
    totalTrades: 0,
    successRate: 0,
    totalPnl: '0',
    avgExecutionTime: 0,
    recentActivity: []
  };

  const activeBotsData: ActiveBot[] = activeBots?.activeBots || [];
  const strategiesData: TradingStrategy[] = strategies?.strategies || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Bot className="h-8 w-8 text-purple-400" />
              Advanced AI Trading Bots
            </h1>
            <p className="text-gray-400 mt-2">
              Intelligent trading automation with adaptive strategies and real-time optimization
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              {dashboard.activeBots} Active
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Stop
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Emergency Stop All Bots</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will immediately stop all running AI trading bots. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => emergencyStopMutation.mutate()}
                    disabled={emergencyStopMutation.isPending}
                  >
                    Stop All Bots
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Bots</p>
                  <p className="text-2xl font-bold text-white">{dashboard.totalBots}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{dashboard.totalTrades}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${parseFloat(dashboard.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPnl(dashboard.totalPnl)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Execution</p>
                  <p className="text-2xl font-bold text-white">{dashboard.avgExecutionTime.toFixed(0)}ms</p>
                </div>
                <Timer className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="control" className="text-white data-[state=active]:bg-purple-600">Bot Control</TabsTrigger>
            <TabsTrigger value="performance" className="text-white data-[state=active]:bg-purple-600">Performance</TabsTrigger>
            <TabsTrigger value="strategies" className="text-white data-[state=active]:bg-purple-600">Strategies</TabsTrigger>
            <TabsTrigger value="logs" className="text-white data-[state=active]:bg-purple-600">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Bot Control Tab */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bot Control Panel */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    Bot Control Panel
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Start and configure your AI trading bots
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Select Bot</label>
                    <Select value={selectedBot?.toString() || ""} onValueChange={(value) => setSelectedBot(parseInt(value))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a bot" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {userBots?.bots?.map((bot: any) => (
                          <SelectItem key={bot.id} value={bot.id.toString()} className="text-white focus:bg-slate-600">
                            {bot.name} - {bot.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Trading Pair</label>
                    <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="BTC/USDT" className="text-white focus:bg-slate-600">BTC/USDT</SelectItem>
                        <SelectItem value="ETH/USDT" className="text-white focus:bg-slate-600">ETH/USDT</SelectItem>
                        <SelectItem value="SOL/USDT" className="text-white focus:bg-slate-600">SOL/USDT</SelectItem>
                        <SelectItem value="ADA/USDT" className="text-white focus:bg-slate-600">ADA/USDT</SelectItem>
                        <SelectItem value="DOT/USDT" className="text-white focus:bg-slate-600">DOT/USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Risk Level</label>
                    <Select value={selectedRiskLevel} onValueChange={(value: any) => setSelectedRiskLevel(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="low" className="text-white focus:bg-slate-600">Low Risk</SelectItem>
                        <SelectItem value="medium" className="text-white focus:bg-slate-600">Medium Risk</SelectItem>
                        <SelectItem value="high" className="text-white focus:bg-slate-600">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleStartBot}
                    disabled={!selectedBot || startBotMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {startBotMutation.isPending ? (
                      <>Starting...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start AI Bot
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Bots */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Active Bots ({activeBotsData.length})
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Currently running AI trading bots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeBotsData.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No active bots</p>
                    ) : (
                      activeBotsData.map((bot) => (
                        <div key={bot.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-600 text-white">{bot.symbol}</Badge>
                              <span className="text-white font-medium">{bot.name}</span>
                            </div>
                            <p className="text-sm text-gray-400">{bot.currentStrategy}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStopBot(bot.id, bot.symbol)}
                            disabled={stopBotMutation.isPending}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {selectedBot && botPerformance ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Bot Performance Metrics</CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time performance data for Bot ID: {selectedBot}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-white">{botPerformance.performance.totalTrades}</p>
                        <p className="text-sm text-gray-400">Total Trades</p>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-white">{botPerformance.performance.successfulTrades}</p>
                        <p className="text-sm text-gray-400">Successful</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-white font-medium">{formatPercentage(botPerformance.performance.successRate)}</span>
                      </div>
                      <Progress 
                        value={botPerformance.performance.successRate} 
                        className="h-2 bg-slate-700"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total P&L</span>
                      <span className={`font-bold ${botPerformance.performance.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPnl(botPerformance.performance.totalPnl)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Avg Execution Time</span>
                      <span className="text-white">{botPerformance.performance.avgExecutionTime.toFixed(2)}ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-64 text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                        <p>Performance chart visualization</p>
                        <p className="text-sm">Coming soon with advanced analytics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-xl font-medium text-white mb-2">Select a Bot</h3>
                  <p className="text-gray-400">Choose a bot from the Control Panel to view its performance metrics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategiesData.map((strategy) => (
                <Card key={strategy.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">{strategy.name}</CardTitle>
                      <Badge 
                        variant={strategy.type === 'ml' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {strategy.type.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400 text-sm">
                      {strategy.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-400">{formatPercentage(strategy.winRate)}</p>
                        <p className="text-xs text-gray-400">Win Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{formatPnl(strategy.avgPnl)}</p>
                        <p className="text-xs text-gray-400">Avg P&L</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Risk Score</span>
                        <span className="text-white">{parseFloat(strategy.riskScore).toFixed(1)}/10</span>
                      </div>
                      <Progress 
                        value={(parseFloat(strategy.riskScore) / 10) * 100}
                        className="h-1 bg-slate-700"
                      />
                    </div>

                    {strategy.backtestResults && (
                      <div className="pt-2 border-t border-slate-600">
                        <p className="text-xs text-gray-400 mb-2">Backtest Results</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Trades: </span>
                            <span className="text-white">{strategy.backtestResults.totalTrades}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Return: </span>
                            <span className="text-green-400">{formatPercentage(strategy.backtestResults.totalReturn)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            {selectedBot && botLogs ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity - Bot {selectedBot}</CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest 20 trading signals and executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {botLogs.logs.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No activity logs yet</p>
                    ) : (
                      botLogs.logs.map((log: BotLog) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={log.signal === 'buy' ? 'bg-green-600' : log.signal === 'sell' ? 'bg-red-600' : 'bg-gray-600'}
                              >
                                {log.signal.toUpperCase()}
                              </Badge>
                              <span className="text-white font-medium">{log.coin}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.strategy.confidence.toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(log.timestamp).toLocaleString()} • {log.executionTime}ms
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${log.result === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPnl(log.pnl)}
                              </span>
                              {log.result === 'success' ? (
                                <TrendingUp className="h-4 w-4 text-green-400" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-xl font-medium text-white mb-2">Select a Bot</h3>
                  <p className="text-gray-400">Choose a bot to view its activity logs and execution history</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}