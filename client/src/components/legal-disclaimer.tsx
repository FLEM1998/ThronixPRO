import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, DollarSign, Users, Gavel } from 'lucide-react';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalDisclaimer({ onAccept, onDecline }: LegalDisclaimerProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-yellow-400">
            Important Legal Disclaimer
          </CardTitle>
          <CardDescription className="text-slate-300">
            Please read and acknowledge the following terms before using ThronixPRO Trading Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Financial Risk Warning</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong>ThronixPRO Trading Platform is NOT LIABLE for any financial losses</strong> incurred while using our platform. 
                  Cryptocurrency trading involves substantial risk of loss and is not suitable for all investors. 
                  You may lose all of your invested capital.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Platform Liability</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• No responsibility for trading losses</li>
                    <li>• No guarantee of platform availability</li>
                    <li>• Technical issues are not compensated</li>
                    <li>• Exchange API failures are not our fault</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">User Responsibility</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Secure your API keys properly</li>
                    <li>• Verify all trades before execution</li>
                    <li>• Understand market risks</li>
                    <li>• Trade with money you can afford to lose</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Gavel className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Legal Terms</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  By using ThronixPRO, you agree that you are solely responsible for your trading decisions and their outcomes. 
                  ThronixPRO provides tools and services "as is" without warranties. We are not a financial advisor and do not 
                  provide investment advice. All trading is done at your own risk.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="acknowledge" 
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                className="border-slate-400"
              />
              <label htmlFor="acknowledge" className="text-sm text-slate-300 cursor-pointer">
                I acknowledge that I have read and understand the above disclaimer. I agree that ThronixPRO is not liable 
                for any financial losses I may incur while using the platform.
              </label>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={onAccept} 
                disabled={!acknowledged}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                I Accept the Terms
              </Button>
              <Button 
                onClick={onDecline} 
                variant="outline" 
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                I Decline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}