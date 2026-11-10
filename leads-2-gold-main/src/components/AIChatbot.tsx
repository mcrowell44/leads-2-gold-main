import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `https://gbkczpjywixipmlaflgy.supabase.co/functions/v1/ai-chat`;

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Howdy, partner! 🤠 I'm your prospecting task agent. Ask me about industries, lead strategies, or how to reach your ideal customers." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia2N6cGp5d2l4aXBtbGFmbGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjAxODUsImV4cCI6MjA1ODc5NjE4NX0.cPLFYZAtQvaFY62mHnhY15RfWWFibMyGNM-fazR54JM`,
        },
        body: JSON.stringify({ 
          messages: [...messages.slice(1), userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry partner, I'm having trouble connecting. Try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-rust hover:bg-rust/90 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-2xl z-50 bg-dust border-leather">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-leather/20 bg-leather text-dust rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-display font-bold">Lead Assistant</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(false)}
          className="text-dust hover:bg-leather/80"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-rust/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-rust" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-rust text-white'
                  : 'bg-leather/10 text-leather'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gold" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-rust/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-rust animate-pulse" />
            </div>
            <div className="bg-leather/10 p-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-leather/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-leather/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-leather/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-leather/20">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about leads, industries..."
            className="flex-1 border-leather/30"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            variant="rust"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
