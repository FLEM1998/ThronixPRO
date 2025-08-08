import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, Plus, Save, Trash2, Bot, X } from "lucide-react";
import { useState } from "react";
import AdvancedBotCreator from "./advanced-bot-creator";

interface TradingBot {
  id: number;
  name: string;
  symbol: string;
  strategy: string;
  status: string;
  quoteAmount: string;
  pnl: string;
}

interface TradingBotsProps {
  onNavigateToExchange?: () => void;
}

export default function TradingBots({ onNavigateToExchange }: TradingBotsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [expandedBotId, setExpandedBotId] = useState<number | null>(null);
  const [advancedBotOpen, setAdvancedBotOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    symbol: '',
    strategy: '',
    quoteAmount: '',
    status: 'stopped'
  });

  const { data: bots, isLoading, error } = useQuery<TradingBot[]>({
    queryKey: ['/api/trading-bots'],
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (botId: number) => {
      const response = await apiRequest('DELETE', `/api/trading-bots/${botId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      setExpandedBotId(null);
      toast({
        title: "Bot Deleted",
        description: "Trading bot deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating bot - starting request...');
      try {
        const response = await apiRequest('POST', '/api/trading-bots', {
          name: `Simple Bot ${Date.now()}`,
          symbol: 'BTCUSDT',
          strategy: 'grid',
          exchange: 'binance',
          quoteAmount: '100',
          status: 'stopped'
        });
        console.log('Bot creation response received:', response);
        return response.json();
      } catch (error) {
        console.error('Bot creation request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Bot created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      toast({
        title: "Bot Created",
        description: "New trading bot created successfully",
      });
    },
    onError: (error) => {
      console.error('Bot creation mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const updateBotStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/trading-bots/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      toast({
        title: "Bot Status Updated",
        description: "Bot status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Bot status update error:', error);
      toast({
        title: "Error",
        description: "Failed to update bot status",
        variant: "destructive",
      });
    },
  });

  const updateBotSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/trading-bots/${selectedBot?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      setExpandedBotId(null);
      toast({
        title: "Settings Updated",
        description: "Bot settings updated successfully",
      });
    },
    onError: (error) => {
      console.error('Bot settings update error:', error);
      toast({
        title: "Error",
        description: "Failed to update bot settings",
        variant: "destructive",
      });
    },
  });

  const handleToggleBot = (bot: TradingBot) => {
    const newStatus = bot.status === 'running' ? 'stopped' : 'running';
    updateBotStatusMutation.mutate({ id: bot.id, status: newStatus });
  };

  const handleOpenSettings = (bot: TradingBot) => {
    if (expandedBotId === bot.id) {
      setExpandedBotId(null);
    } else {
      setSelectedBot(bot);
      setEditForm({
        name: bot.name,
        symbol: bot.symbol,
        strategy: bot.strategy,
        quoteAmount: bot.quoteAmount,
        status: bot.status
      });
      setExpandedBotId(bot.id);
    }
  };

  const handleSaveSettings = () => {
    updateBotSettingsMutation.mutate({
      ...editForm,
      id: selectedBot?.id
    });
  };

  const handleDeleteBot = (botId: number) => {
    deleteBotMutation.mutate(botId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      running: 'bg-green-500/20 text-green-400 border-green-500/30',
      stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (isLoading) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="text-white">Trading Bots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">Loading bots...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="trading-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-white">Trading Bots</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs sm:text-sm flex-1 sm:flex-none"
                onClick={() => createBotMutation.mutate()}
                disabled={createBotMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Simple Bot</span>
                <span className="sm:hidden">Simple</span>
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-xs sm:text-sm flex-1 sm:flex-none"
                onClick={() => setAdvancedBotOpen(true)}
              >
                <Bot className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Advanced Bot</span>
                <span className="sm:hidden">Advanced</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bots && Array.isArray(bots) && bots.length > 0 ? (
            <div className="space-y-4">
              {bots.map((bot: TradingBot) => (
                <div key={bot.id} className="glass-card rounded-lg p-4">
                  {/* Main Bot Info Row */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)} ${
                          bot.status === 'running' ? 'animate-pulse' : ''
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-white">{bot.name}</h3>
                          <p className="text-sm text-gray-400">
                            {bot.strategy.charAt(0).toUpperCase() + bot.strategy.slice(1)} Strategy • {bot.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">${bot.quoteAmount}</div>
                        <div className={`text-xs ${parseFloat(bot.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseFloat(bot.pnl) >= 0 ? '+' : ''}{parseFloat(bot.pnl).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Control Buttons Row */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusBadge(bot.status)} px-2 py-1`}>
                        {bot.status}
                      </Badge>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSettings(bot)}
                          className={`px-3 py-1 h-8 border-gray-600 hover:bg-gray-800 ${
                            expandedBotId === bot.id ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                          }`}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleBot(bot)}
                          className={`px-3 py-1 h-8 border-gray-600 hover:bg-gray-800 ${
                            bot.status === 'running' ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {bot.status === 'running' ? 
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Stop
                            </> : 
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </>
                          }
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Bot Settings - Full Width */}
                  {expandedBotId === bot.id && selectedBot && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="space-y-4">
                        <h4 className="text-white font-medium text-sm">Bot Configuration</h4>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor={`bot-name-${bot.id}`} className="text-sm font-medium text-gray-300">
                              Bot Name
                            </Label>
                            <Input
                              id={`bot-name-${bot.id}`}
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-700 h-9"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`symbol-${bot.id}`} className="text-sm font-medium text-gray-300">
                              Trading Pair
                            </Label>
                            <Select value={editForm.symbol} onValueChange={(value) => setEditForm({ ...editForm, symbol: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-gray-600">
                                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                                <SelectItem value="ADAUSDT">ADA/USDT</SelectItem>
                                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                                <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`strategy-${bot.id}`} className="text-sm font-medium text-gray-300">
                              Strategy
                            </Label>
                            <Select value={editForm.strategy} onValueChange={(value) => setEditForm({ ...editForm, strategy: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-gray-600">
                                <SelectItem value="grid">Grid Trading</SelectItem>
                                <SelectItem value="momentum">Momentum</SelectItem>
                                <SelectItem value="scalping">Scalping</SelectItem>
                                <SelectItem value="dca">DCA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`quote-amount-${bot.id}`} className="text-sm font-medium text-gray-300">
                              Quote Amount (USDT)
                            </Label>
                            <Input
                              id={`quote-amount-${bot.id}`}
                              type="number"
                              value={editForm.quoteAmount}
                              onChange={(e) => setEditForm({ ...editForm, quoteAmount: e.target.value })}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-700 h-9"
                            />
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`bot-status-${bot.id}`}
                                checked={editForm.status === 'running'}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, status: checked ? 'running' : 'stopped' })}
                              />
                              <Label htmlFor={`bot-status-${bot.id}`} className="text-sm font-medium text-gray-300">
                                {editForm.status === 'running' ? 'Running' : 'Stopped'}
                              </Label>
                            </div>
                            
                            <Button
                              onClick={() => handleDeleteBot(selectedBot.id)}
                              disabled={deleteBotMutation.isPending}
                              variant="destructive"
                              size="sm"
                              className="h-8"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Bot
                            </Button>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-700">
                            <Button
                              onClick={() => setExpandedBotId(null)}
                              variant="outline"
                              className="flex-1 h-9 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveSettings}
                              disabled={updateBotSettingsMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 h-9 bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                              {updateBotSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No trading bots configured</div>
              <div className="text-sm text-gray-500">Create your first bot to start automated trading</div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Advanced Bot Creator Modal */}
      {advancedBotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <AdvancedBotCreator 
            onClose={() => setAdvancedBotOpen(false)} 
            onNavigateToExchange={onNavigateToExchange}
          />
        </div>
      )}
    </>
  );
}