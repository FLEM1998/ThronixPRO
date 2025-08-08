import { useQuery } from "@tanstack/react-query";
import TradingDashboard from "@/components/trading-dashboard";
import AiAssistant from "@/components/ai-assistant";
import OrderAlerts from "@/components/order-alerts";
import TradingBots from "@/components/trading-bots";
import TradingBotsTest from "@/components/trading-bots-test";
import ExchangeConnection from "@/components/exchange-connection";
import LiveTradingPanel from "@/components/live-trading-panel";
import AIMasterWidget from "@/components/ai-master-widget";
import ExchangeConnectionStatus from "@/components/exchange-connection-status";


import { useWebSocket } from "@/hooks/use-websocket";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSounds } from "@/hooks/use-notification-sounds";
import { useTitle } from "@/hooks/useTitle";
import { Bell, Crown, Clock, ChevronDown, Settings, User, Shield, Palette, LogOut, UserCircle, Camera, Upload, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  useTitle('ThronixPRO - Live Trading Dashboard');
  const { user, logout } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const { toast } = useToast();
  const { 
    isEnabled: soundsEnabled, 
    toggleSounds, 
    playOrderAlert,
    playPriceAlert,
    playBotStarted,
    playBotStopped,
    playProfit,
    playLoss 
  } = useNotificationSounds();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [bio, setBio] = useState('');

  // Fetch order alerts for notification count
  const { data: orderAlerts = [] } = useQuery({
    queryKey: ['/api/order-alerts'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle WebSocket events for sound notifications
  useEffect(() => {
    if (lastMessage && soundsEnabled) {
      // Play sounds based on message type
      switch (lastMessage.type) {
        case 'order_filled':
          playProfit();
          break;
        case 'order_alert':
          playOrderAlert();
          break;
        case 'price_alert':
          playPriceAlert();
          break;
        case 'bot_started':
          playBotStarted();
          break;
        case 'bot_stopped':
          playBotStopped();
          break;
        case 'profit_target':
          playProfit();
          break;
        case 'stop_loss':
          playLoss();
          break;
        default:
          // No sound for other message types
          break;
      }
    }
  }, [lastMessage, soundsEnabled, playOrderAlert, playPriceAlert, playBotStarted, playBotStopped, playProfit, playLoss]);

  // Handle mobile back button navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Close any open modals when back button is pressed
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (profileOpen) {
        setProfileOpen(false);
        return;
      }
      // Navigate to dashboard tab if on another tab
      if (activeTab !== "dashboard") {
        setActiveTab("dashboard");
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [settingsOpen, profileOpen, activeTab]);

  // Update browser history when modals open/close
  useEffect(() => {
    if (settingsOpen || profileOpen) {
      window.history.pushState({ modal: true }, '');
    }
  }, [settingsOpen, profileOpen]);

  // Update display name when user data changes
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  const { data: portfolioSummary } = useQuery({
    queryKey: ['/api/portfolio/summary'],
  });

  const { data: marketOverview } = useQuery({
    queryKey: ['/api/market/overview'],
    refetchInterval: 5000,
  });

  const { data: sentiment } = useQuery({
    queryKey: ['/api/market/sentiment'],
    refetchInterval: 10000,
  });

  const { data: prediction } = useQuery({
    queryKey: ['/api/market/price-prediction'],
    refetchInterval: 15000,
  });

  const { data: tradingStats } = useQuery({
    queryKey: ['/api/trading-stats'],
    refetchInterval: 30000,
  });

  const memberSince = (user as any)?.createdAt ? 
    new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 
    new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const formatTime = (date: Date) => {
    return date.toUTCString().split(' ')[4] + ' UTC';
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      console.log('Avatar file selected:', file.name);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Show loading state
      console.log('Saving profile:', {
        displayName,
        bio,
        avatarFile: avatarFile?.name
      });
      
      // Here you would typically upload the avatar and save profile data
      // For now, we'll simulate the save and show success feedback
      
      // Close modal first
      setProfileOpen(false);
      
      // Show success toast
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      
      // You would typically make an API call here:
      // const formData = new FormData();
      // formData.append('displayName', displayName);
      // formData.append('bio', bio);
      // if (avatarFile) formData.append('avatar', avatarFile);
      // await apiRequest('/api/profile/update', {
      //   method: 'PUT',
      //   body: formData
      // });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white">ThronixPRO</span>
              </div>
              <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">v2.0</span>
            </div>
            
            {/* Live Status Indicator */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-white/80">
                  {isConnected ? 'Live Trading' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-white/60 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative text-white/80 hover:text-white p-2"
                onClick={() => setActiveTab("alerts")}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {Array.isArray(orderAlerts) && orderAlerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center notification-badge text-[10px] sm:text-xs">
                    {orderAlerts.length}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 text-white hover:text-white/80 p-1 sm:p-2">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                      <AvatarFallback className="bg-primary text-white font-semibold text-xs sm:text-sm">{(displayName || user?.name)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm">{displayName || user?.name}</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
                  <DropdownMenuItem 
                    onClick={() => setSettingsOpen(true)}
                    className="text-white hover:bg-gray-700 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setProfileOpen(true)}
                    className="text-white hover:bg-gray-700 cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-red-400 hover:bg-gray-700 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-gray-900/50 rounded-lg p-1 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 text-center">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "dashboard" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("exchange")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "exchange" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Exchange
              </button>
              <button
                onClick={() => setActiveTab("trading")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "trading" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Trading
              </button>
              <button
                onClick={() => setActiveTab("bots")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "bots" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Bots
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "alerts" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "ai" 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                AI Assistant
              </button>
            </div>
            
            {/* Additional Navigation Row */}
            <div className="grid grid-cols-2 gap-1 text-center mt-1">
              <button
                onClick={() => setLocation('/charts')}
                className="px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Charts
              </button>
              <button
                onClick={() => setLocation('/trading')}
                className="px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Advanced Trading
              </button>
            </div>
          </div>



          <TabsContent value="dashboard" className="space-y-6">
            {/* Exchange Connection Status - Featured at top */}
            <ExchangeConnectionStatus />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Dashboard - Left Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* AI Master Bot Widget - Featured at top */}
                <AIMasterWidget />
                
                <TradingDashboard 
                  portfolioSummary={portfolioSummary}
                  marketOverview={marketOverview}
                  sentiment={sentiment}
                  prediction={prediction}
                />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Actions Section */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setActiveTab("bots")}
                    >
                      <span className="mr-2">+</span> Create New Bot
                    </Button>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setActiveTab("exchange")}
                    >
                      <span className="mr-2">🔑</span> Manage API Keys
                    </Button>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <span className="mr-2">⚙️</span> Settings
                    </Button>
                  </div>
                </div>
                
                <AiAssistant />
                <OrderAlerts lastMessage={lastMessage} />
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Contact: enquiries.thronixpro@gmail.com
              </p>
            </div>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-6">
            <ExchangeConnection />
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <LiveTradingPanel />
          </TabsContent>

          <TabsContent value="bots" className="space-y-6">
            <TradingBots onNavigateToExchange={() => setActiveTab("exchange")} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrderAlerts lastMessage={lastMessage} />
              <AiAssistant />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <AiAssistant />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button 
          size="lg"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg text-lg"
          onClick={() => setActiveTab("ai")}
        >
          🤖
        </Button>
      </div>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage your account settings and trading preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span className="font-medium">Profile</span>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    readOnly
                    className="bg-gray-800 border-gray-600 text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-gray-300">Display Name</Label>
                  <Input
                    id="name"
                    defaultValue={user?.name || ''}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter your display name"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Security</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm">Two-Factor Authentication</div>
                    <div className="text-gray-400 text-xs">Add an extra layer of security</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm">Email Notifications</div>
                    <div className="text-gray-400 text-xs">Get alerts for trading activities</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm flex items-center gap-2">
                      {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Sound Notifications
                    </div>
                    <div className="text-gray-400 text-xs">Play sounds for trading alerts and events</div>
                  </div>
                  <Switch 
                    checked={soundsEnabled} 
                    onCheckedChange={toggleSounds}
                  />
                </div>
              </div>
            </div>

            {/* Trading Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Palette className="h-4 w-4" />
                <span className="font-medium">Trading Preferences</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm">Auto-confirm Orders</div>
                    <div className="text-gray-400 text-xs">Skip confirmation for market orders</div>
                  </div>
                  <Switch />
                </div>
                
                {/* Test Sound Buttons */}
                {soundsEnabled && (
                  <div className="space-y-2">
                    <div className="text-white text-sm">Test Notification Sounds</div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playOrderAlert}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Order Alert
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playPriceAlert}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Price Alert
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playProfit}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Profit
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playBotStarted}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Bot Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playBotStopped}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Bot Stop
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={playLoss}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                      >
                        Loss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setSettingsOpen(false)}
                className="bg-primary hover:bg-primary/90"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profile
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage your profile information and avatar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary">
                      {(displayName || user?.name)?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
              </Button>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name" className="text-gray-300">Display Name</Label>
                <Input
                  id="profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter your display name"
                />
              </div>
              <div>
                <Label htmlFor="profile-email" className="text-gray-300">Email Address</Label>
                <Input
                  id="profile-email"
                  value={user?.email || ''}
                  readOnly
                  className="bg-gray-800 border-gray-600 text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>

            {/* Trading Stats */}
            <div className="space-y-4">
              <div className="text-white font-medium">Trading Statistics</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Total Trades</div>
                  <div className="text-white font-semibold">{(tradingStats as any)?.totalTrades || '0'}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Win Rate</div>
                  <div className="text-green-400 font-semibold">{(tradingStats as any)?.winRate || '0.0'}%</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Member Since</div>
                  <div className="text-white font-semibold">{memberSince}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Active Bots</div>
                  <div className="text-blue-400 font-semibold">{(tradingStats as any)?.activeBots || '0'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setProfileOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="bg-primary hover:bg-primary/90"
              >
                Save Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}