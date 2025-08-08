import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/hooks/useTitle";
import { Crown } from "lucide-react";

export default function Login() {
  useTitle("ThronixPRO - Login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Login failed",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);
      if (user) {
        toast({
          title: "Login successful",
          description: "Welcome to ThronixPRO Trading Platform",
        });
        // Force navigation using window.location for better reliability
        window.location.href = '/dashboard';
      } else {
        throw new Error('Login failed - no user returned');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed", 
        description: error.message || "Invalid credentials. Please check your email and password.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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
            <p className="text-white/80">Advanced Trading Platform</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Enter your email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white h-12 text-base font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-3">

            <p className="text-white/70 text-sm">
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Forgot your password?
              </Link>
            </p>
            <p className="text-white/70 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
