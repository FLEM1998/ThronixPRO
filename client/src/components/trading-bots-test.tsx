import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TradingBotsTest() {
  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="text-white">Trading Bots - Test Component</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-white">
          This is a test component to verify rendering works
        </div>
      </CardContent>
    </Card>
  );
}