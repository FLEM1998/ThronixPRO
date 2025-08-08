import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionLockout } from "@/components/subscription-lockout";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import Dashboard from "@/pages/dashboard";
import Charts from "@/pages/Charts";
import AdvancedTrading from "@/pages/AdvancedTrading";
import AdvancedBots from "@/pages/AdvancedBots";
import Login from "@/pages/login";
import DownloadPage from "@/pages/download";

import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import ManualReset from "@/pages/ManualReset";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";


function Router() {
  const { user, loading } = useAuth();
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const [pathname, setLocation] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && (pathname === "/login" || pathname === "/register")) {
      setLocation("/dashboard");
    }
  }, [user, pathname, setLocation]);

  if (loading || (user && isLoadingSubscription)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  // MANDATORY SUBSCRIPTION LOCKOUT - Block access if not subscribed
  if (user && subscriptionStatus && !subscriptionStatus.isActive) {
    return <SubscriptionLockout onRetryPayment={() => window.location.reload()} />;
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Dashboard /> : <Register />}
      </Route>
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route path="/manual-reset">
        <ManualReset />
      </Route>
      <Route path="/dashboard">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/charts">
        {user ? <Charts /> : <Login />}
      </Route>
      <Route path="/trading">
        {user ? <AdvancedTrading /> : <Login />}
      </Route>
      <Route path="/advanced-trading">
        {user ? <AdvancedTrading /> : <Login />}
      </Route>
      <Route path="/advanced-bots">

              {user ? <AdvancedBots /> : <Login />}
      </Route>
     <Route path="/download">
              <DownloadPage />
            </Route>
       
      <Route path="/">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
