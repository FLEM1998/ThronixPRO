import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PortfolioMetrics {
  id: number;
  date: string;
  totalValue: string;
  dailyReturn: string;
  cumulativeReturn: string;
  sharpeRatio: string;
  maxDrawdown: string;
  volatility: string;
  winRate: string;
  profitFactor: string;
  paperTrade: boolean;
}

interface PortfolioAnalyticsProps {
  // Live trading only - no props needed
}

export default function PortfolioAnalytics(): React.JSX.Element {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch portfolio analytics data - live trading only
  const { data: metrics = [], isLoading } = useQuery<PortfolioMetrics[]>({
    queryKey: ['/api/portfolio/analytics', { timeRange, paperTrade: false }],
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Calculate current performance metrics
  const currentMetrics = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const latest = metrics[metrics.length - 1];
    const oldest = metrics[0];
    
    // Calculate additional metrics
    const totalReturn = ((parseFloat(latest.totalValue) - parseFloat(oldest.totalValue)) / parseFloat(oldest.totalValue)) * 100;
    const daysSince = Math.max(1, Math.floor((new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)));
    const annualizedReturn = (Math.pow(1 + totalReturn / 100, 365 / daysSince) - 1) * 100;
    
    return {
      ...latest,
      totalReturn,
      annualizedReturn,
      daysSince,
    };
  }, [metrics]);

  // Performance chart data
  const chartData = useMemo(() => {
    return metrics.map(m => ({
      date: new Date(m.date).toLocaleDateString(),
      value: parseFloat(m.totalValue),
      return: parseFloat(m.cumulativeReturn) * 100,
    }));
  }, [metrics]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (value: string | number, decimals = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
  };

  const formatRatio = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  };

  const getRiskLevel = (sharpeRatio: number, maxDrawdown: number) => {
    if (sharpeRatio > 1 && Math.abs(maxDrawdown) < 10) return { level: 'Low', color: 'text-green-400' };
    if (sharpeRatio > 0.5 && Math.abs(maxDrawdown) < 20) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'High', color: 'text-red-400' };
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Portfolio Analytics
          </h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          Loading portfolio analytics...
        </div>
      </div>
    );
  }

  if (!currentMetrics) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Portfolio Analytics
          </h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          No portfolio data available
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(parseFloat(currentMetrics.sharpeRatio), parseFloat(currentMetrics.maxDrawdown));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Portfolio Analytics
          <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-800">
            Real Money
          </Badge>
        </h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="7d" className="text-white hover:bg-gray-700">7 Days</SelectItem>
            <SelectItem value="30d" className="text-white hover:bg-gray-700">30 Days</SelectItem>
            <SelectItem value="90d" className="text-white hover:bg-gray-700">90 Days</SelectItem>
            <SelectItem value="1y" className="text-white hover:bg-gray-700">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Portfolio Value</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(currentMetrics.totalValue)}
          </div>
          <div className={`text-sm ${currentMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercentage(currentMetrics.totalReturn)}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Sharpe Ratio</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {formatRatio(currentMetrics.sharpeRatio)}
          </div>
          <div className="text-sm text-gray-400">
            Risk-adjusted return
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Max Drawdown</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400">
            {formatPercentage(currentMetrics.maxDrawdown)}
          </div>
          <div className="text-sm text-gray-400">
            Worst decline
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Win Rate</span>
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {formatPercentage(currentMetrics.winRate, 1)}
          </div>
          <div className="text-sm text-gray-400">
            Profitable trades
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Risk Assessment</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Level</span>
              <span className={riskLevel.color}>{riskLevel.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volatility</span>
              <span className="text-white">{formatPercentage(currentMetrics.volatility)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profit Factor</span>
              <span className="text-white">{formatRatio(currentMetrics.profitFactor)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Returns Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Return</span>
              <span className={`${parseFloat(currentMetrics.dailyReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(currentMetrics.dailyReturn)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cumulative</span>
              <span className={`${parseFloat(currentMetrics.cumulativeReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(parseFloat(currentMetrics.cumulativeReturn) * 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Annualized</span>
              <span className={`${currentMetrics.annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(currentMetrics.annualizedReturn)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Performance Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Time Period</span>
              <span className="text-white">{currentMetrics.daysSince} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data Points</span>
              <span className="text-white">{metrics.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white">
                {new Date(currentMetrics.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-4 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Portfolio Value Over Time
        </h4>
        <div className="h-48 flex items-end space-x-1">
          {chartData.slice(-30).map((point, index) => {
            const maxValue = Math.max(...chartData.map(p => p.value));
            const height = (point.value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-colors relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {point.date}<br />
                  {formatCurrency(point.value)}<br />
                  {formatPercentage(point.return)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Hover over bars to see details
        </div>
      </div>

      {/* Risk Warning */}
      {parseFloat(currentMetrics.maxDrawdown) < -15 && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <div className="flex items-center text-red-400">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">High Risk Warning</span>
          </div>
          <div className="text-sm text-red-300 mt-1">
            Your portfolio has experienced a significant drawdown. Consider reviewing your risk management strategy.
          </div>
        </div>
      )}
    </div>
  );
}