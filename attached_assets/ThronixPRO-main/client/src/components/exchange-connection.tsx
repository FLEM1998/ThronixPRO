import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const apiKeySchema = z.object({
  exchange: z.enum(['binance', 'kucoin', 'bybit', 'coinbase', 'kraken']),
  apiKey: z.string().min(10, 'API key is required'),
  secretKey: z.string().min(10, 'Secret key is required'),
  testnet: z.boolean().default(false),
});

type ApiKeyForm = z.infer<typeof apiKeySchema>;

interface ApiKey {
  id: number;
  exchange: string;
  testnet: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function ExchangeConnection() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      exchange: 'binance',
      apiKey: '',
      secretKey: '',
      testnet: true,
    },
  });

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/exchange/api-keys'],
  });

  const addApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyForm) => {
      const response = await apiRequest('POST', '/api/exchange/api-keys', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Exchange API key added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exchange/api-keys'] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add API key',
        variant: 'destructive',
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/exchange/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exchange/api-keys'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/exchange/test-connection/${id}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Test',
        description: data.success ? 'Connection successful!' : 'Connection failed: ' + data.error,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ApiKeyForm) => {
    addApiKeyMutation.mutate(data);
  };

  const toggleSecretVisibility = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-900/20 border-blue-500/30">
        <AlertDescription className="text-blue-400">
          <strong>Live Data Required:</strong> Connect your exchange API keys to access real market data and trading features. 
          The platform only displays authentic exchange data and requires active connections for full functionality.
        </AlertDescription>
      </Alert>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Exchange Connections</h3>
          <p className="text-sm text-gray-400">Connect your exchange accounts to trade with real funds</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exchange
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Add Exchange API Keys</CardTitle>
            <CardDescription>
              Connect your exchange account with API keys. Keep your keys secure and only use trusted exchanges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchange" className="text-gray-200">Exchange</Label>
                <select
                  {...form.register('exchange')}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                >
                  <option value="binance">Binance</option>
                  <option value="coinbase">Coinbase Pro</option>
                  <option value="kraken">Kraken</option>
                  <option value="bybit">Bybit</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-gray-200">API Key</Label>
                <Input
                  id="apiKey"
                  {...form.register('apiKey')}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter your API key"
                />
                {form.formState.errors.apiKey && (
                  <p className="text-red-400 text-sm">{form.formState.errors.apiKey.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-gray-200">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  {...form.register('secretKey')}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter your secret key"
                />
                {form.formState.errors.secretKey && (
                  <p className="text-red-400 text-sm">{form.formState.errors.secretKey.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="testnet"
                  {...form.register('testnet')}
                  className="rounded"
                />
                <Label htmlFor="testnet" className="text-gray-200">Use Testnet (Recommended for testing)</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addApiKeyMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addApiKeyMutation.isPending ? 'Adding...' : 'Add API Key'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400 mb-4">No exchange connections found</p>
              <p className="text-sm text-gray-500">Add your first exchange to start trading with real funds</p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key: ApiKey) => (
            <Card key={key.id} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="text-white font-medium capitalize">{key.exchange}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={key.testnet ? "secondary" : "default"}>
                          {key.testnet ? "Testnet" : "Live"}
                        </Badge>
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnectionMutation.mutate(key.id)}
                      disabled={testConnectionMutation.isPending}
                    >
                      Test Connection
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteApiKeyMutation.mutate(key.id)}
                      disabled={deleteApiKeyMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Added: {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Alert>
        <AlertDescription>
          <strong>Security Notice:</strong> Your API keys are encrypted and stored securely. 
          Never share your API keys with anyone. Only add keys from exchanges you trust.
          Always enable 2FA on your exchange accounts.
        </AlertDescription>
      </Alert>
    </div>
  );
}