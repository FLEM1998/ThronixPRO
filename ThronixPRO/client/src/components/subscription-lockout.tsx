import React from 'react';
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionLockoutProps {
  onRetryPayment: () => void;
  isVerifying?: boolean;
}

export function SubscriptionLockout({ onRetryPayment, isVerifying = false }: SubscriptionLockoutProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto border-red-500 bg-gray-900 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-red-400">
            Payment Required
          </CardTitle>
          <CardDescription className="text-gray-300">
            Update payment for use of app
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-red-950 border border-red-500 rounded-lg p-4">
            <p className="text-sm text-red-200 text-center">
              Your subscription has expired or payment verification failed. 
              Please update your payment method to continue using ThronixPRO.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onRetryPayment}
              disabled={isVerifying}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Payment Method
                </>
              )}
            </Button>
            
            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>• Huawei AppGallery subscribers: Check your subscription status</p>
              <p>• Samsung Galaxy Store subscribers: Verify your purchase</p>
              <p>• Contact support if payment issues persist</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-500 text-center">
              ThronixPRO requires active subscription for access to live trading features and AI strategies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}