import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/hooks/useTitle";
import { Crown, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  useTitle("ThronixPRO - Reset Password");
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [emailServiceError, setEmailServiceError] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', { email });
      const data = await response.json();
      
      setSent(true);
      
      toast({
        title: "Reset email sent",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-effect border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Crown className="h-8 w-8 text-yellow-400" />
              <CardTitle className="text-3xl font-bold text-white">ThronixPRO</CardTitle>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">v2.0</span>
              <p className="text-white/80">Password Reset Sent</p>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-green-400 text-lg font-medium">
              ✅ Check your email
            </div>
            <p className="text-white/80 text-sm">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="text-white/60 text-xs">
              The reset link will expire in 1 hour for security.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Crown className="h-8 w-8 text-yellow-400" />
            <CardTitle className="text-3xl font-bold text-white">Thronix</CardTitle>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">v2.0</span>
            <p className="text-white/80">Reset Password</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Enter your email address"
                required
              />
              <p className="text-white/60 text-xs mt-2">
                Enter the email address associated with your ThronixPRO account
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-medium"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <p className="text-white/70 text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Sign In
              </Link>
            </p>
            <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-500/20 rounded-md p-3">
              🔒 For security, password reset links expire in 1 hour
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}