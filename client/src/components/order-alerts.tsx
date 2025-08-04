import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface OrderAlert {
  id: number;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  type: string;
  message?: string;
  createdAt: string;
}

interface OrderAlertsProps {
  lastMessage?: any;
}

export default function OrderAlerts({ lastMessage }: OrderAlertsProps) {
  const queryClient = useQueryClient();
  
  const { data: alerts } = useQuery({
    queryKey: ['/api/order-alerts'],
  });

  useEffect(() => {
    if (lastMessage?.type === 'order_alert') {
      // Add new alert to the cache
      queryClient.setQueryData(['/api/order-alerts'], (oldData: OrderAlert[]) => {
        const newAlert = lastMessage.data;
        return [newAlert, ...(oldData || [])].slice(0, 20);
      });
    }
  }, [lastMessage, queryClient]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getAlertColor = (side: string) => {
    switch (side.toLowerCase()) {
      case 'buy': return 'bg-green-500';
      case 'sell': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Live Alerts</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-600 text-white text-xs">Live</Badge>
            <Badge className="bg-orange-600 text-white text-xs">Real Money</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="scrollable space-y-3">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert: OrderAlert) => (
              <div key={alert.id} className="glass-card rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getAlertColor(alert.side)}`}></div>
                    <span className="text-sm font-medium text-white">
                      {alert.side.toUpperCase()} Order
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(alert.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {alert.message || `${alert.side.toUpperCase()} order executed`}
                </p>
                <div className="text-xs text-gray-400 mt-1">
                  <span>{alert.quantity} {alert.symbol.replace('USDT', '')}</span> @ <span>${alert.price}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No recent alerts</p>
              <p className="text-xs mt-1">Live order alerts will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
