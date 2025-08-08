import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Crown, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "This reset link is invalid or has expired.",
        variant: "destructive",
      });
      setLocation('/forgot-password');
    }
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        password,
        confirmPassword
      });
      const data = await response.json();
      
      setSuccess(true);
      toast({
        title: "Password Updated",
        description: data.message,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
              <p className="text-white/80">Password Updated</p>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-green-400 text-lg font-medium">
              ✅ Password successfully updated
            </div>
            <p className="text-white/80 text-sm">
              Your password has been updated. You can now log in with your new password.
            </p>
            <p className="text-white/60 text-xs">
              Redirecting to login page in 3 seconds...
            </p>
            <Link href="/login">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Continue to Login
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
            <p className="text-white/80">Set New Password</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium text-sm">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base pr-12"
                  placeholder="Enter your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <p className="text-white/60 text-xs mt-2">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white font-medium text-sm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base pr-12"
                  placeholder="Confirm your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-medium"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-md p-3">
              🔒 Your new password will be encrypted and stored securely
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}