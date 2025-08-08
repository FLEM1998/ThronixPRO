import AIMasterBot from "@/components/ai-master-bot";

export default function AIMasterBotPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Master Bot</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The ultimate AI-powered trading bot that automatically selects the best strategies to maximize your profits.
            Simply set your investment amount and crypto pair, then let AI do the rest.
          </p>
        </div>
        
        <AIMasterBot />
      </div>
    </div>
  );
}