import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, TrendingUp, TrendingDown, Layers, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AdvancedOrder {
  id: number;
  symbol: string;
  exchange: string;
  type: 'oco' | 'iceberg' | 'twap';
  status: 'pending' | 'active' | 'filled' | 'cancelled';
  totalQuantity: string;
  executedQuantity: string;
  ocoStopPrice?: string;
  ocoLimitPrice?: string;
  ocoStopLimitPrice?: string;
  icebergQuantity?: string;
  icebergVisibleSize?: string;
  paperTrade: boolean;
  createdAt: string;
}

interface AdvancedOrdersProps {
  symbol?: string;
}

export default function AdvancedOrders({ symbol }: AdvancedOrdersProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orderType, setOrderType] = useState<'oco' | 'iceberg'>('oco');
  const [formData, setFormData] = useState({
    symbol: symbol || '',
    exchange: 'kucoin',
    quantity: '',
    // OCO fields
    stopPrice: '',
    limitPrice: '',
    stopLimitPrice: '',
    // Iceberg fields
    visibleSize: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch advanced orders - live trading only
  const { data: orders = [], isLoading } = useQuery<AdvancedOrder[]>({
    queryKey: ['/api/advanced-orders', { symbol, paperTrade: false }],
    refetchInterval: 3000,
  });

  // Create advanced order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/advanced-orders', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Advanced order created successfully",
      });
      setShowCreateForm(false);
      setFormData({
        symbol: symbol || '',
        exchange: 'kucoin',
        quantity: '',
        stopPrice: '',
        limitPrice: '',
        stopLimitPrice: '',
        visibleSize: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest('DELETE', `/api/advanced-orders/${orderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      ...formData,
      type: orderType,
      paperTrade: false, // Live trading only
      totalQuantity: formData.quantity,
      ...(orderType === 'oco' ? {
        ocoStopPrice: formData.stopPrice,
        ocoLimitPrice: formData.limitPrice,
        ocoStopLimitPrice: formData.stopLimitPrice,
      } : {
        icebergQuantity: formData.quantity,
        icebergVisibleSize: formData.visibleSize,
      }),
    };

    createOrderMutation.mutate(orderData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-900/20 text-blue-400 border-blue-800';
      case 'filled': return 'bg-green-900/20 text-green-400 border-green-800';
      case 'cancelled': return 'bg-red-900/20 text-red-400 border-red-800';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oco': return <Target className="w-4 h-4" />;
      case 'iceberg': return <Layers className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Advanced Orders
          <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-800">
            Real Money
          </Badge>
        </h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          Create Advanced Order
        </Button>
      </div>

      {/* Create Order Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-white">Create Advanced Order</h4>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Order Type</label>
                <Select value={orderType} onValueChange={(value: 'oco' | 'iceberg') => setOrderType(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="oco" className="text-white hover:bg-gray-700">OCO (One-Cancels-Other)</SelectItem>
                    <SelectItem value="iceberg" className="text-white hover:bg-gray-700">Iceberg Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g., BTC/USDT"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Exchange</label>
                <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="kucoin" className="text-white hover:bg-gray-700">KuCoin</SelectItem>
                    <SelectItem value="bybit" className="text-white hover:bg-gray-700">Bybit</SelectItem>
                    <SelectItem value="binance" className="text-white hover:bg-gray-700">Binance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                <Input
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  step="0.00000001"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            {/* OCO Order Fields */}
            {orderType === 'oco' && (
              <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white">OCO Parameters</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Stop Price</label>
                    <Input
                      value={formData.stopPrice}
                      onChange={(e) => setFormData({ ...formData, stopPrice: e.target.value })}
                      placeholder="0.00"
                      type="number"
                      step="0.00000001"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Limit Price</label>
                    <Input
                      value={formData.limitPrice}
                      onChange={(e) => setFormData({ ...formData, limitPrice: e.target.value })}
                      placeholder="0.00"
                      type="number"
                      step="0.00000001"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Stop Limit Price</label>
                    <Input
                      value={formData.stopLimitPrice}
                      onChange={(e) => setFormData({ ...formData, stopLimitPrice: e.target.value })}
                      placeholder="0.00"
                      type="number"
                      step="0.00000001"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Iceberg Order Fields */}
            {orderType === 'iceberg' && (
              <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white">Iceberg Parameters</h5>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Visible Size</label>
                  <Input
                    value={formData.visibleSize}
                    onChange={(e) => setFormData({ ...formData, visibleSize: e.target.value })}
                    placeholder="0.00"
                    type="number"
                    step="0.00000001"
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Amount visible in the order book at once
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading advanced orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No advanced orders found</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(order.type)}
                    <span className="font-medium text-white">{order.symbol}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-900/20 text-gray-400 border-gray-800">
                    {order.type.toUpperCase()}
                  </Badge>
                </div>
                {order.status === 'active' && (
                  <Button
                    onClick={() => cancelOrderMutation.mutate(order.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-800 hover:bg-red-900/20"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Quantity</div>
                  <div className="text-white font-mono">{parseFloat(order.totalQuantity).toFixed(8)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Executed</div>
                  <div className="text-white font-mono">{parseFloat(order.executedQuantity).toFixed(8)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Progress</div>
                  <div className="text-white">
                    {((parseFloat(order.executedQuantity) / parseFloat(order.totalQuantity)) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Created</div>
                  <div className="text-white">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Order Type Specific Details */}
              {order.type === 'oco' && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded">
                  <div className="text-xs text-gray-400 mb-2">OCO Parameters</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Stop Price</div>
                      <div className="text-white font-mono">${parseFloat(order.ocoStopPrice || '0').toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Limit Price</div>
                      <div className="text-white font-mono">${parseFloat(order.ocoLimitPrice || '0').toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Stop Limit</div>
                      <div className="text-white font-mono">${parseFloat(order.ocoStopLimitPrice || '0').toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              )}

              {order.type === 'iceberg' && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded">
                  <div className="text-xs text-gray-400 mb-2">Iceberg Parameters</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Visible Size</div>
                      <div className="text-white font-mono">{parseFloat(order.icebergVisibleSize || '0').toFixed(8)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Hidden</div>
                      <div className="text-white font-mono">
                        {(parseFloat(order.totalQuantity) - parseFloat(order.icebergVisibleSize || '0')).toFixed(8)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}