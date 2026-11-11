import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContactStore } from '../../hooks/useContactStore';
import { useDealStore } from '../../store/dealStore';
import { useAIApiKeys } from '../../hooks/useAIApiKeys';
import { openclawService } from '../../services/openclawService';

interface OpenClawChatWidgetProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const OpenClawChatWidget: React.FC<OpenClawChatWidgetProps> = ({ className = '' }) => {
  const { contacts } = useContactStore();
  const { deals } = useDealStore();
  const { apiConfig } = useAIApiKeys();
  const isConfigured = Boolean(apiConfig?.openclaw?.apiKey?.trim());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant powered by OpenClaw. I can help you with CRM insights, deal analysis, contact enrichment, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isConfigured) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setError(null);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context from current CRM data
      const contactsArray = Object.values(contacts || {}).slice(0, 20).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        status: c.status,
      }));

      const dealsArray = Object.values(deals || {}).slice(0, 20).map((d: any) => ({
        id: d.id,
        title: d.title,
        company: d.company,
        stage: typeof d.stage === 'string' ? d.stage : d.stage?.name,
        value: d.value,
      }));

      const context = {
        contacts: contactsArray,
        deals: dealsArray,
        currentView: 'dashboard',
      };

      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await openclawService.sendMessage(userMessage.content, history, context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('OpenClaw chat error:', error);
      setError(error instanceof Error ? error.message : 'Request to OpenClaw failed');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <GlassCard className={`flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">OpenClaw AI Assistant</h3>
        </div>
        <MessageSquare className="w-4 h-4 text-gray-500" />
      </div>

      {!isConfigured && (
        <div
          data-testid="openclaw-not-configured"
          className="px-4 py-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-200"
        >
          OpenClaw is not configured. Add your OpenClaw API key in AI settings to start chatting.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            data-testid="openclaw-chat-error"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your CRM..."
            disabled={isLoading || !isConfigured}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading || !isConfigured} size="sm">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default OpenClawChatWidget;
