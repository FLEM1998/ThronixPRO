import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EmailVerificationBannerProps {
  userEmail: string;
  onVerified?: () => void;
  verificationToken?: string;
}

export default function EmailVerificationBanner({ 
  userEmail, 
  onVerified, 
  verificationToken 
}: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resendMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/resend-verification', 'POST', { email: userEmail });
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest(`/api/auth/verify-email?token=${token}`, 'GET');
    },
    onSuccess: (data) => {
      toast({
        title: "Email Verified Successfully",
        description: "You can now access all trading features!",
      });
      setIsVisible(false);
      onVerified?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const manualVerifyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/manual-verify', 'POST', { email: userEmail });
    },
    onSuccess: () => {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now access all trading features.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsVisible(false);
      onVerified?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerifyNow = () => {
    if (verificationToken) {
      verifyMutation.mutate(verificationToken);
    }
  };

  if (!isVisible) return null;

  return (
    <Alert className="border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Email Verification Required
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            Please verify your email address ({userEmail}) to access all trading features.
            Trading functions are restricted until verification is complete.
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {verificationToken && (
            <Button
              size="sm"
              onClick={handleVerifyNow}
              disabled={verifyMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {verifyMutation.isPending ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Mail className="w-3 h-3 mr-1" />
              )}
              Verify Now
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            {resendMutation.isPending ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Resend Email
          </Button>
          <Button
            size="sm"
            onClick={() => manualVerifyMutation.mutate()}
            disabled={manualVerifyMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {manualVerifyMutation.isPending ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <CheckCircle className="w-3 h-3 mr-1" />
            )}
            Skip Email
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="text-yellow-700 hover:text-yellow-800 dark:text-yellow-300"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}