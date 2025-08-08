import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ManualReset() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/manual-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setSuccess(false);
        setMessage(data.error || 'Password reset failed');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Manual Password Reset</CardTitle>
          <CardDescription className="text-white/80">
            Temporary reset for email delivery issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
              {success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
              <AlertDescription className={success ? 'text-green-300' : 'text-red-300'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Enter your email"
                required
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

            {success && (
              <div className="text-center">
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}