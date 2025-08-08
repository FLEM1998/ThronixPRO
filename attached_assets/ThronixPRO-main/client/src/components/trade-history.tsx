import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, TrendingUp, TrendingDown, Filter, Download, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Trade {
  id: number;
  orderId: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  type: string;
  quantity: string;
  price: string;
  fee: string;
  feeCurrency: string;
  realizedPnl: string;
  paperTrade: boolean;
  executedAt: string;
}

interface TradeHistoryProps {
  userId?: number;
  symbol?: string;
}

export default function TradeHistory({ userId, symbol }: TradeHistoryProps) {
  const [filterSymbol, setFilterSymbol] = useState<string>(symbol || 'all');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Fetch trade history - live trading only
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trade-history', { userId, symbol: filterSymbol !== 'all' ? filterSymbol : undefined, paperTrade: false, dateRange }],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Filter trades based on selected criteria
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (filterSide !== 'all' && trade.side !== filterSide) return false;
      return true;
    });
  }, [trades, filterSide]);

  // Calculate P&L summary
  const pnlSummary = useMemo(() => {
    const summary = filteredTrades.reduce((acc, trade) => {
      const pnl = parseFloat(trade.realizedPnl || '0');
      const fee = parseFloat(trade.fee || '0');
      
      return {
        totalPnl: acc.totalPnl + pnl,
        totalFees: acc.totalFees + fee,
        winningTrades: pnl > 0 ? acc.winningTrades + 1 : acc.winningTrades,
        losingTrades: pnl < 0 ? acc.losingTrades + 1 : acc.losingTrades,
        totalTrades: acc.totalTrades + 1,
      };
    }, {
      totalPnl: 0,
      totalFees: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalTrades: 0,
    });

    return {
      ...summary,
      winRate: summary.totalTrades > 0 ? (summary.winningTrades / summary.totalTrades) * 100 : 0,
      netPnl: summary.totalPnl - summary.totalFees,
    };
  }, [filteredTrades]);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.01) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toFixed(8);
  };

  const formatQuantity = (quantity: string) => {
    const num = parseFloat(quantity);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPnl = (pnl: string) => {
    const num = parseFloat(pnl);
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Symbol', 'Side', 'Type', 'Quantity', 'Price', 'Fee', 'P&L'];
    const rows = filteredTrades.map(trade => [
      formatDate(trade.executedAt),
      trade.symbol,
      trade.side,
      trade.type,
      trade.quantity,
      trade.price,
      trade.fee,
      trade.realizedPnl,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-live-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <History className="w-5 h-5 mr-2" />
          Trade History
          <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-800">
            Real Money
          </Badge>
        </h3>
        <Button
          onClick={downloadCSV}
          variant="outline"
          size="sm"
          className="text-gray-300 border-gray-600 hover:bg-gray-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Net P&L</div>
          <div className={`text-lg font-bold ${pnlSummary.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPnl(pnlSummary.netPnl.toString())}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Win Rate</div>
          <div className="text-lg font-bold text-white">
            {pnlSummary.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Total Trades</div>
          <div className="text-lg font-bold text-white">
            {pnlSummary.totalTrades}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Total Fees</div>
          <div className="text-lg font-bold text-red-400">
            ${pnlSummary.totalFees.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">W/L Ratio</div>
          <div className="text-lg font-bold text-white">
            {pnlSummary.losingTrades > 0 ? (pnlSummary.winningTrades / pnlSummary.losingTrades).toFixed(2) : '∞'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={filterSymbol} onValueChange={setFilterSymbol}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="All Symbols" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Symbols</SelectItem>
            <SelectItem value="BTC/USDT" className="text-white hover:bg-gray-700">BTC/USDT</SelectItem>
            <SelectItem value="ETH/USDT" className="text-white hover:bg-gray-700">ETH/USDT</SelectItem>
            <SelectItem value="ADA/USDT" className="text-white hover:bg-gray-700">ADA/USDT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSide} onValueChange={setFilterSide}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="All Sides" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Sides</SelectItem>
            <SelectItem value="buy" className="text-white hover:bg-gray-700">Buy Only</SelectItem>
            <SelectItem value="sell" className="text-white hover:bg-gray-700">Sell Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="1d" className="text-white hover:bg-gray-700">1 Day</SelectItem>
            <SelectItem value="7d" className="text-white hover:bg-gray-700">7 Days</SelectItem>
            <SelectItem value="30d" className="text-white hover:bg-gray-700">30 Days</SelectItem>
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade List */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading trade history...</div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No trades found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 pb-2">Date</th>
                <th className="text-left text-gray-400 pb-2">Symbol</th>
                <th className="text-left text-gray-400 pb-2">Side</th>
                <th className="text-left text-gray-400 pb-2">Type</th>
                <th className="text-right text-gray-400 pb-2">Quantity</th>
                <th className="text-right text-gray-400 pb-2">Price</th>
                <th className="text-right text-gray-400 pb-2">Fee</th>
                <th className="text-right text-gray-400 pb-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 text-gray-300">
                    {formatDate(trade.executedAt)}
                  </td>
                  <td className="py-3 text-white font-medium">
                    {trade.symbol}
                  </td>
                  <td className="py-3">
                    <Badge 
                      variant="outline" 
                      className={`${
                        trade.side === 'buy' 
                          ? 'bg-green-900/20 text-green-400 border-green-800' 
                          : 'bg-red-900/20 text-red-400 border-red-800'
                      }`}
                    >
                      {trade.side === 'buy' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {trade.side.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-gray-300 capitalize">
                    {trade.type}
                  </td>
                  <td className="py-3 text-right text-white font-mono">
                    {formatQuantity(trade.quantity)}
                  </td>
                  <td className="py-3 text-right text-white font-mono">
                    ${formatPrice(trade.price)}
                  </td>
                  <td className="py-3 text-right text-red-400 font-mono">
                    ${parseFloat(trade.fee || '0').toFixed(4)}
                  </td>
                  <td className="py-3 text-right font-mono">
                    <span className={`${
                      parseFloat(trade.realizedPnl || '0') >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPnl(trade.realizedPnl || '0')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}