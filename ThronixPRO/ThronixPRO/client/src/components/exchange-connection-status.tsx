import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Wifi, DollarSign } from 'lucide-react';


interface ExchangeConnectionStatusProps {
  className?: string;
}

export default function ExchangeConnectionStatus({ className = '' }: ExchangeConnectionStatusProps) {

  
  // Get portfolio summary which includes exchange connection status
  const { data: portfolioData } = useQuery({
    queryKey: ['/api/portfolio/summary'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const data = portfolioData as any;
  const connectedExchanges = data?.connectedExchanges || 0;
  const totalBalance = data?.totalBalance || '0.00';
  const isConnected = connectedExchanges > 0;

  return (
    <div className={`bg-gradient-to-r ${isConnected ? 'from-green-900/20 to-blue-900/20 border-green-700/50' : 'from-orange-900/20 to-red-900/20 border-orange-700/50'} border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isConnected ? 'bg-green-600/20' : 'bg-orange-600/20'}`}>
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-400" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-orange-400'}`} />
              <span className="text-white font-medium">
                {isConnected ? `${connectedExchanges} Exchanges Connected` : 'No Exchanges Connected'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {isConnected 
                ? 'All trading operations use live exchange balances'
                : 'Connect exchange for live trading'
              }
            </div>
          </div>
        </div>
        
        {isConnected ? (
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold">{totalBalance}</span>
            </div>
            <div className="text-xs text-gray-400">Live Balance</div>
          </div>
        ) : (
          <div className="text-right">
            <button 
              onClick={() => window.location.hash = '#/exchange-connections'}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Connect Exchange
            </button>
          </div>
        )}
      </div>
      
      {isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-300">
            ✓ AI Master Bot ready for live trading
            <br />
            ✓ Trading bots can access live balances
            <br />
            ✓ Advanced trading enabled with real funds
            <br />
            ✓ Manual trading ready with live balances
          </div>
        </div>
      )}
      
      {!isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-orange-300">
            ⚠ Trading requires exchange API connection
            <br />
            • Go to Exchange tab to add your API keys
            <br />
            • Supported: Binance, KuCoin, Bybit
            <br />
            • All trading uses live exchange balances only
          </div>
        </div>
      )}
    </div>
  );
}