import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getToken } from '@/lib/queryClient';

interface SubscriptionStatus {
  isActive: boolean;
  expiryDate?: string;
  productId?: string;
  provider?: 'huawei' | 'samsung' | 'web';
  lastVerified?: string;
}

interface SubscriptionVerificationData {
  provider: 'huawei' | 'samsung';
  purchaseToken?: string;
  purchaseId?: string;
  productId: string;
}

export function useSubscriptionStatus() {
  const queryClient = useQueryClient();
  const [isLocked, setIsLocked] = useState(false);

  // read token once per render; if no token, do NOT call protected endpoints
  const token = getToken();

  const {
    data: subscriptionStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status', Boolean(token)],
    queryFn: async () => apiRequest('/api/subscription/status'),
    enabled: Boolean(token),               // <-- gate behind token
    refetchInterval: token ? 30000 : false,
    refetchOnWindowFocus: Boolean(token),
    retry: false,
  });

  const verifySubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionVerificationData) =>
      apiRequest('/api/subscription/verify', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
  });

  useEffect(() => {
    if (subscriptionStatus && !isLoading) {
      setIsLocked(!subscriptionStatus.isActive);
    } else if (!token) {
      // logged out or registering: don't show lockout banner
      setIsLocked(false);
    }
  }, [subscriptionStatus, isLoading, token]);

  const verifySubscription = async (data: SubscriptionVerificationData) => {
    try {
      await verifySubscriptionMutation.mutateAsync(data);
      return true;
    } catch (err) {
      console.error('Subscription verification failed:', err);
      return false;
    }
  };

  return {
    subscriptionStatus,
    isLoading,
    isLocked,
    error,
    verifySubscription,
    retryVerification: refetch,
    isVerifying: verifySubscriptionMutation.isPending,
  };
}
