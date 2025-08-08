import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
//import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, Plus, Save, Trash2, Bot } from "lucide-react";
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

export default function TradingBots() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedBotOpen, setAdvancedBotOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    symbol: '',
    strategy: '',
    quoteAmount: '',
    status: ''
  });
  
  const { data: bots, isLoading } = useQuery({
    queryKey: ['/api/trading-bots'],
  });

  const updateBotMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/trading-bots/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      toast({
        title: "Bot Updated",
        description: "Trading bot status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update trading bot status",
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
        title: "Creation Failed",
        description: error.message || "Failed to create trading bot",
        variant: "destructive",
      });
    },
  });

  const updateBotSettingsMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/trading-bots/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      toast({
        title: "Settings Updated",
        description: "Bot settings updated successfully",
      });
      setSettingsOpen(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update bot settings",
        variant: "destructive",
      });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/trading-bots/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
      toast({
        title: "Bot Deleted",
        description: "Bot deleted successfully",
      });
      setSettingsOpen(false);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const handleToggleBot = (bot: TradingBot) => {
    const newStatus = bot.status === 'running' ? 'stopped' : 'running';
    updateBotMutation.mutate({ id: bot.id, status: newStatus });
  };

  const handleOpenSettings = (bot: TradingBot) => {
    setSelectedBot(bot);
    setEditForm({
      name: bot.name,
      symbol: bot.symbol,
      strategy: bot.strategy,
      quoteAmount: bot.quoteAmount,
      status: bot.status
    });
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!selectedBot) return;
    updateBotSettingsMutation.mutate({
      id: selectedBot.id,
      updates: {
        name: editForm.name,
        symbol: editForm.symbol,
        strategy: editForm.strategy,
        quoteAmount: editForm.quoteAmount,
        status: editForm.status
      }
    });
  };

  const handleDeleteBot = () => {
    if (!selectedBot) return;
    deleteBotMutation.mutate(selectedBot.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPnlColor = (pnl: string) => {
    const value = parseFloat(pnl);
    return value > 0 ? 'price-up' : value < 0 ? 'price-down' : 'text-gray-400';
  };

  if (isLoading) {
    return (
      <Card className="trading-card">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading trading bots...</div>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {bots && bots.length > 0 ? (
          <div className="space-y-4">
            {bots.map((bot: TradingBot) => (
              <div key={bot.id} className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)} ${
                      bot.status === 'running' ? 'animate-pulse' : ''
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-white">{bot.name}</h4>
                      <p className="text-sm text-gray-400">
                        {bot.strategy.charAt(0).toUpperCase() + bot.strategy.slice(1)} Strategy • {bot.symbol}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right mr-4">
                    <p className={`text-lg font-semibold ${getPnlColor(bot.pnl)}`}>
                      {parseFloat(bot.pnl) > 0 ? '+' : ''}${bot.pnl}
                    </p>
                    <p className="text-sm text-gray-400">
                      {((parseFloat(bot.pnl) / parseFloat(bot.quoteAmount)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      {bot.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      onClick={() => handleOpenSettings(bot)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleBot(bot)}
                      disabled={updateBotMutation.isPending}
                      className={`${
                        bot.status === 'running'
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                          : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                      }`}
                    >
                      {bot.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>No trading bots configured</p>
            <p className="text-xs mt-1">Create your first bot to start automated trading</p>
          </div>
        )}
      </CardContent>

      {/* Bot Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-lg w-full max-w-[420px] max-h-[85vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-gray-600 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-semibold">Bot Settings</h2>
                <p className="text-gray-400 text-sm">Configure your trading bot parameters</p>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {selectedBot && (
                <div className="space-y-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bot-name" className="text-sm font-medium text-gray-300">
                    Bot Name
                  </Label>
                  <Input
                    id="bot-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-700 h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="symbol" className="text-sm font-medium text-gray-300">
                    Trading Pair
                  </Label>
                  <Select value={editForm.symbol} onValueChange={(value) => setEditForm({ ...editForm, symbol: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-10">
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
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="strategy" className="text-sm font-medium text-gray-300">
                    Strategy
                  </Label>
                  <Select value={editForm.strategy} onValueChange={(value) => setEditForm({ ...editForm, strategy: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-gray-600">
                      <SelectItem value="grid">Grid Trading</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="rsi">RSI Strategy</SelectItem>
                      <SelectItem value="macd">MACD Strategy</SelectItem>
                      <SelectItem value="scalping">Scalping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="quote-amount" className="text-sm font-medium text-gray-300">
                    Quote Amount (USDT)
                  </Label>
                  <Input
                    id="quote-amount"
                    type="number"
                    value={editForm.quoteAmount}
                    onChange={(e) => setEditForm({ ...editForm, quoteAmount: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-700 h-9"
                    min="10"
                    step="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Bot Status</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editForm.status === 'running'}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, status: checked ? 'running' : 'stopped' })}
                    />
                    <span className="text-sm text-gray-300">
                      {editForm.status === 'running' ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <Badge variant={editForm.status === 'running' ? 'default' : 'secondary'} className="text-xs">
                    {editForm.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteBot}
                    disabled={deleteBotMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 h-10"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteBotMutation.isPending ? 'Deleting...' : 'Delete Bot'}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSettingsOpen(false)}
                      className="h-9 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={updateBotSettingsMutation.isPending}
                      className="flex items-center justify-center gap-2 h-9 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      {updateBotSettingsMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Bot Creator Modal */}
      {advancedBotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <AdvancedBotCreator onClose={() => setAdvancedBotOpen(false)} />
        </div>
      )}
    </Card>
  );
}
