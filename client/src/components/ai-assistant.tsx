import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

export default function AiAssistant() {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const { data: strategySuggestions } = useQuery({
    queryKey: ['/api/ai/strategy-suggestion'],
    refetchInterval: 30000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', { message });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setChatHistory(prev => [
        ...prev,
        { type: 'user', message: variables, timestamp: new Date() },
        { type: 'ai', message: data.reply, timestamp: new Date() }
      ]);
      setChatInput('');
    },
    onError: () => {
      toast({
        title: "AI Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      chatMutation.mutate(chatInput.trim());
    }
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">AI Assistant</CardTitle>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Suggestions */}
        {strategySuggestions && strategySuggestions.suggestions && (
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="text-sm">
                <p className="text-primary-200 font-medium mb-1">Strategy Suggestion</p>
                <p className="text-white/90">
                  {strategySuggestions.suggestions[0]?.strategy}: {strategySuggestions.suggestions[0]?.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto scrollable">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`p-2 rounded text-sm ${
                msg.type === 'user' 
                  ? 'bg-blue-600/20 ml-4' 
                  : 'bg-gray-700/50 mr-4'
              }`}>
                <p className="text-white/90">{msg.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI about markets..."
            className="bg-gray-800 border-gray-700 text-white text-sm"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit"
            disabled={chatMutation.isPending || !chatInput.trim()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4 mr-2" />
            {chatMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
