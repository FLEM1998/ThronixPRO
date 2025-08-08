import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Bot, TrendingUp, TrendingDown, PieChart, AlertTriangle } from "lucide-react";

interface TradingDashboardProps {
  portfolioSummary?: any;
  marketOverview?: any;
  sentiment?: any;
  prediction?: any;
}

export default function TradingDashboard({ 
  portfolioSummary, 
  marketOverview, 
  sentiment, 
  prediction 
}: TradingDashboardProps) {
  const { data: openPositions } = useQuery({
    queryKey: ['/api/positions/open'],
  });

  // Check if market data is available
  const hasMarketData = marketOverview && !marketOverview.error;
  const needsExchangeConnection = marketOverview?.error === 'LIVE_DATA_REQUIRED' || marketOverview?.error === 'INCOMPLETE_LIVE_DATA';

  return (
    <div className="space-y-6">
      {/* Live Data Notice */}
      {needsExchangeConnection && (
        <Alert className="bg-amber-900/20 border-amber-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-amber-400">
            <strong>Exchange Connection Required:</strong> To access live market data and trading features, please connect your exchange API keys in the Exchange Connections tab. 
            This platform only displays authentic live data from real exchanges.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Live Exchange Balance</p>
                  <Badge className="bg-orange-600 text-white text-xs">Real Money</Badge>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${portfolioSummary?.totalBalance || '0.00'}
                </p>
                <p className="text-sm price-up">
                  {portfolioSummary?.dayPnlPercent ? 
                    `${parseFloat(portfolioSummary.dayPnlPercent) >= 0 ? '+' : ''}${portfolioSummary.dayPnlPercent}% ($${portfolioSummary.dayPnl})` : 
                    'Connect exchange to view'
                  }
                </p>
              </div>
              <div className="text-primary">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Bots</p>
                <p className="text-2xl font-bold text-white">
                  {portfolioSummary?.activeBots || '0'}
                </p>
                <p className="text-sm text-blue-400">
                  {portfolioSummary?.runningBots || '0'} running
                </p>
              </div>
              <div className="text-blue-400">
                <Bot className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">24h P&L</p>
                <p className={`text-2xl font-bold ${parseFloat(portfolioSummary?.dayPnl || '0') >= 0 ? 'price-up' : 'price-down'}`}>
                  {parseFloat(portfolioSummary?.dayPnl || '0') >= 0 ? '+' : ''}${portfolioSummary?.dayPnl || '0.00'}
                </p>
                <p className={`text-sm ${parseFloat(portfolioSummary?.dayPnlPercent || '0') >= 0 ? 'price-up' : 'price-down'}`}>
                  {parseFloat(portfolioSummary?.dayPnlPercent || '0') >= 0 ? '+' : ''}{portfolioSummary?.dayPnlPercent || '0.00'}%
                </p>
              </div>
              <div className="text-green-400">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Open Positions</p>
                <p className="text-2xl font-bold text-white">
                  {portfolioSummary?.openPositions || '0'}
                </p>
                <p className="text-sm text-amber-400">Real live positions</p>
              </div>
              <div className="text-amber-400">
                <PieChart className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Sentiment & Price Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Market Sentiment</CardTitle>
              <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">
                AI Powered
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentiment?.error === 'LIVE_DATA_REQUIRED' ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-amber-400 font-medium">News Service Required</p>
                <p className="text-sm text-gray-400 mt-2">
                  Connect live news API for real-time market sentiment analysis
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Overall</span>
                  <span className="text-green-400 font-semibold">
                    {sentiment?.sentimentScore > 0 ? 'Bullish' : sentiment?.sentimentScore < 0 ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.max(0, Math.min(100, ((sentiment?.sentimentScore || 0) + 1) * 50))}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center">
                  <span className={`text-2xl font-bold ${(sentiment?.sentimentScore || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sentiment?.sentimentScore > 0 ? '+' : ''}{sentiment?.sentimentScore?.toFixed(2) || '0.00'}
                  </span>
                  <p className="text-sm text-gray-400">Sentiment Score</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Price Prediction</CardTitle>
              <span className="text-xs bg-primary/20 border border-primary/30 px-2 py-1 rounded-full text-white">
                Next 4h
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {prediction?.error === 'LIVE_DATA_REQUIRED' ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <p className="text-blue-400 font-medium">Exchange Connection Required</p>
                <p className="text-sm text-gray-400 mt-2">
                  Connect exchange API keys for live AI market predictions
                </p>
              </div>
            ) : prediction && prediction.predictedPrice ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-400">{prediction.symbol} Prediction</p>
                  <p className="text-3xl font-bold text-green-400">
                    ${prediction.predictedPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {prediction.priceChange > 0 ? '+' : ''}{prediction.priceChange.toFixed(2)}% in {prediction.timeframe}
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prediction.direction === 'up' ? 'bg-green-500/20 text-green-400' :
                      prediction.direction === 'down' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {prediction.confidence ? `${(prediction.confidence * 100).toFixed(0)}% confidence` : 'Live AI Analysis'}
                    </span>
                  </div>
                </div>
                <div className="chart-container rounded-lg relative">
                  <div className="chart-line"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    {prediction.direction === 'up' ? (
                      <TrendingUp className="h-16 w-16 opacity-20 text-green-500" />
                    ) : prediction.direction === 'down' ? (
                      <TrendingDown className="h-16 w-16 opacity-20 text-red-500" />
                    ) : (
                      <TrendingUp className="h-16 w-16 opacity-20" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-blue-400 font-medium">Loading Live Prediction</p>
                <p className="text-sm text-gray-400 mt-2">
                  Analyzing live market data with AI
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Positions Table */}
      {openPositions && openPositions.length > 0 && (
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-white">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-3">Symbol</th>
                    <th className="text-left py-3">Side</th>
                    <th className="text-right py-3">Size</th>
                    <th className="text-right py-3">Entry Price</th>
                    <th className="text-right py-3">Current Price</th>
                    <th className="text-right py-3">P&L</th>
                    <th className="text-center py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map((position: any) => (
                    <tr key={position.id} className="border-b border-gray-800">
                      <td className="py-3 font-medium text-white">{position.symbol}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          position.side === 'long' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {position.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right text-white">{position.quantity} {position.symbol.replace('USDT', '')}</td>
                      <td className="py-3 text-right text-gray-400">${position.entryPrice}</td>
                      <td className="py-3 text-right text-white">${position.currentPrice}</td>
                      <td className={`py-3 text-right ${parseFloat(position.pnl) > 0 ? 'price-up' : 'price-down'}`}>
                        {parseFloat(position.pnl) > 0 ? '+' : ''}${position.pnl}
                      </td>
                      <td className="py-3 text-center">
                        <button className="text-red-400 hover:text-red-300 text-xs">Close</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
