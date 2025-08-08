import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

  // Check subscription status
  const { data: subscriptionStatus, isLoading, error, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Verify subscription mutation
  const verifySubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionVerificationData) => {
      return apiRequest('/api/subscription/verify', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
  });

  // Update lockout state based on subscription status
  useEffect(() => {
    if (subscriptionStatus && !isLoading) {
      setIsLocked(!subscriptionStatus.isActive);
    }
  }, [subscriptionStatus, isLoading]);

  const verifySubscription = async (data: SubscriptionVerificationData) => {
    try {
      await verifySubscriptionMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error('Subscription verification failed:', error);
      return false;
    }
  };

  const retryVerification = () => {
    refetch();
  };

  return {
    subscriptionStatus,
    isLoading,
    isLocked,
    error,
    verifySubscription,
    retryVerification,
    isVerifying: verifySubscriptionMutation.isPending,
  };
}