import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { z } from 'zod';
import { useTitle } from '@/hooks/useTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import LegalDisclaimer from '@/components/legal-disclaimer';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the legal disclaimer to register',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  useTitle('ThronixPRO - Register');
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  // Register (expect token). If token missing (older server), auto-login as fallback.
  const registerMutation = useMutation({
    mutationFn: async (formData: RegisterForm) => {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      // 1) Try register
      const regRes = await apiRequest('POST', '/api/auth/register', payload);
      const regData = await regRes.json();

      // New server returns { user, token }
      if (regRes.ok && regData?.token) {
        return regData as { token: string; user: any };
      }

      // 2) Fallback: login to get token if register succeeded but no token returned
      // (or if server responded 200 without token for legacy behavior)
      const loginRes = await apiRequest('POST', '/api/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData?.error || 'Login after register failed');
      }

      return loginData as { token: string; user: any };
    },
    onSuccess: (data) => {
      if (!data?.token) {
        setError('No token received from server');
        return;
      }
      // Store token (support both keys for existing code paths)
      localStorage.setItem('thronix_token', data.token);
      localStorage.setItem('token', data.token);
      setLocation('/');
    },
    onError: async (err: any) => {
      // Try to extract server error message if available
      const msg =
        err?.message ||
        (typeof err === 'string' ? err : '') ||
        'Registration failed';
      setError(msg);
    },
  });

  const handleAcceptTerms = () => {
    setShowDisclaimer(false);
    setTermsAccepted(true);
    form.setValue('termsAccepted', true);
  };

  const handleDeclineTerms = () => {
    setLocation('/login');
  };

  const onSubmit = (data: RegisterForm) => {
    setError('');
    if (!data.termsAccepted) {
      setError('You must accept the legal disclaimer to register');
      return;
    }
    registerMutation.mutate(data);
  };

  // Show legal disclaimer first
  if (showDisclaimer) {
    return (
      <LegalDisclaimer
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-purple-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-300">
            Join ThronixPRO to start trading with real funds
          </CardDescription>
          {termsAccepted && (
            <div className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded-md p-2 mt-2">
              ✓ Legal disclaimer accepted - ThronixPRO is not liable for financial losses
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/*
              Register the termsAccepted field as a hidden input. Without this
              hidden field, react-hook-form may mark the boolean field as
              required and display an empty "Required" error on some browsers.
              By registering it explicitly we ensure the field is always part
              of the form data, and its value is controlled via handleAcceptTerms.
            */}
            <input type="hidden" {...form.register('termsAccepted')} />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">Full Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Enter your full name"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Enter your email address"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Create a secure password"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register('confirmPassword')}
                className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 text-base"
                placeholder="Confirm your password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
