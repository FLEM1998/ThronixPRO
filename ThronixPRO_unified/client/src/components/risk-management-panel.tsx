import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, TrendingDown, TrendingUp } from 'lucide-react';

interface RiskManagementPanelProps {
  className?: string;
}

function RiskManagementPanel({ className = "" }: RiskManagementPanelProps) {
  // Fetch real portfolio data from connected exchanges
  const { data: portfolioSummary } = useQuery({
    queryKey: ['/api/portfolio/summary'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const { data: openPositions } = useQuery({
    queryKey: ['/api/positions/open'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Calculate risk metrics from real data
  const totalBalance = parseFloat((portfolioSummary as any)?.totalBalance || '0');
  const dayPnl = parseFloat((portfolioSummary as any)?.dayPnl || '0');
  const dayPnlPercent = totalBalance > 0 ? (dayPnl / totalBalance) * 100 : 0;
  const positionsCount = Array.isArray(openPositions) ? openPositions.length : 0;
  
  // Risk calculations based on actual data
  const riskScore = totalBalance === 0 ? 0 : Math.min(10, Math.max(1, (Math.abs(dayPnlPercent) * 2) + (positionsCount * 0.5)));
  const exposure = totalBalance === 0 ? 0 : Math.min(100, positionsCount * 15); // Rough exposure calculation
  const maxDrawdown = Math.abs(Math.min(0, dayPnlPercent));
  
  const riskMetrics = {
    portfolioValue: totalBalance,
    dayPnl: dayPnl,
    dayPnlPercent: dayPnlPercent,
    maxDrawdown: maxDrawdown,
    marginLevel: 1000, // This would need real margin data from exchange
    openPositions: positionsCount,
    riskScore: riskScore,
    exposure: exposure
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Portfolio Overview */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Management
            <span className="text-green-400 text-sm ml-auto">Real Money</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Portfolio Value */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Portfolio Value</span>
            <span className="text-white font-semibold">${riskMetrics.portfolioValue.toLocaleString()}</span>
          </div>

          {/* Daily P&L */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">24h P&L</span>
            <div className="flex items-center gap-2">
              {riskMetrics.dayPnl >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`font-semibold ${riskMetrics.dayPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(riskMetrics.dayPnl).toFixed(2)} ({riskMetrics.dayPnlPercent >= 0 ? '+' : ''}{riskMetrics.dayPnlPercent}%)
              </span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Risk Score</span>
              <span className={`font-semibold ${getRiskColor(riskMetrics.riskScore)}`}>
                {riskMetrics.riskScore}/10 - {getRiskLabel(riskMetrics.riskScore)}
              </span>
            </div>
            <Progress value={riskMetrics.riskScore * 10} className="h-2" />
          </div>

          {/* Exposure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Portfolio Exposure</span>
              <span className="text-white font-semibold">{riskMetrics.exposure}%</span>
            </div>
            <Progress value={riskMetrics.exposure} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskMetrics.portfolioValue === 0 ? (
            <Alert className="border-blue-500 bg-blue-500/10">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-200">
                No Exchange Connected: Connect your exchange API keys to start monitoring live risk metrics
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {riskMetrics.maxDrawdown > 3 && (
                <Alert className="border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    Drawdown Warning: Current drawdown of {riskMetrics.maxDrawdown.toFixed(2)}% approaching 5% limit
                  </AlertDescription>
                </Alert>
              )}

              {riskMetrics.exposure > 80 && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200">
                    High Exposure: Portfolio exposure at {riskMetrics.exposure.toFixed(1)}% - consider reducing positions
                  </AlertDescription>
                </Alert>
              )}

              {riskMetrics.openPositions === 0 && riskMetrics.portfolioValue > 0 && (
                <Alert className="border-green-500 bg-green-500/10">
                  <AlertTriangle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    Low Risk: No open positions detected - portfolio is in safe state
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Risk Controls */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Risk Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Emergency Stop
            </Button>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Auto Rebalance
            </Button>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Reduce Exposure
            </Button>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Close All
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Max Drawdown</span>
              <span className="text-white">5.0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Position Size Limit</span>
              <span className="text-white">20%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Max Concurrent Trades</span>
              <span className="text-white">10</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskManagementPanel;