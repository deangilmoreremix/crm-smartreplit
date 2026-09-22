import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  RefreshCw,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  Mail,
  FileText,
  Lightbulb,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionButton[];
  suggestions?: string[];
}

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  action: string;
  payload?: any;
}

interface SmartAssistantProps {
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  onActionExecute?: (action: string, payload?: any) => void;
  context?: 'contact' | 'deal' | 'pipeline' | 'general';
}

const contextActions: Record<string, ActionButton[]> = {
  contact: [
    { label: 'Schedule Meeting', icon: <Calendar size={16} />, action: 'schedule_meeting' },
    { label: 'Send Email', icon: <Mail size={16} />, action: 'send_email' },
    { label: 'Log Call', icon: <Phone size={16} />, action: 'log_call' },
    { label: 'Add Note', icon: <FileText size={16} />, action: 'add_note' },
    { label: 'Update Score', icon: <TrendingUp size={16} />, action: 'update_score' },
  ],
  deal: [
    { label: 'View Deal', icon: <FileText size={16} />, action: 'view_deal' },
    { label: 'Add Activity', icon: <Calendar size={16} />, action: 'add_activity' },
    { label: 'Update Stage', icon: <TrendingUp size={16} />, action: 'update_stage' },
  ],
  pipeline: [
    { label: 'View Pipeline', icon: <TrendingUp size={16} />, action: 'view_pipeline' },
    { label: 'Add Deal', icon: <Users size={16} />, action: 'add_deal' },
    { label: 'Generate Report', icon: <Sparkles size={16} />, action: 'generate_report' },
  ],
  general: [
    { label: 'Get Insights', icon: <Lightbulb size={16} />, action: 'get_insights' },
    { label: 'Summarize', icon: <FileText size={16} />, action: 'summarize' },
    { label: 'Recommend Next Step', icon: <TrendingUp size={16} />, action: 'recommend' },
  ],
};

const initialSuggestions = [
  'What are the best practices for this contact?',
  'Analyze engagement history',
  'Suggest follow-up actions',
  'Summarize recent interactions',
];

const SmartAssistant: React.FC<SmartAssistantProps> = ({
  contactId,
  contactName = 'there',
  contactEmail,
  onActionExecute,
  context = 'general',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI assistant. I can help you with ${context === 'contact' ? `managing ${contactName}'s profile, analyzing engagement, and suggesting next steps` : 'CRM tasks, insights, and recommendations'}. How can I help?`,
      timestamp: new Date(),
      suggestions: initialSuggestions,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await simulateAIResponse(input, context, contactName);
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const simulateAIResponse = async (
    userInput: string,
    context: string,
    name: string
  ): Promise<{ content: string; actions?: ActionButton[]; suggestions?: string[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const input = userInput.toLowerCase();

    if (input.includes('best practice') || input.includes('tips')) {
      return {
        content: `Based on best practices for managing ${context === 'contact' ? `relationships with ${name}` : 'your CRM'}, here are my recommendations:\n\n1. **Consistent Follow-ups** - Regular touchpoints maintain engagement\n2. **Personalized Communication** - Tailor messages based on their history\n3. **Value-Driven Interactions** - Focus on how you can help them succeed\n4. **Document Everything** - Keep detailed notes for better context`,
        actions: contextActions[context],
        suggestions: [
          'Show engagement analysis',
          'Generate follow-up email',
          'Schedule next touchpoint',
        ],
      };
    }

    if (input.includes('engagement') || input.includes('analyze')) {
      return {
        content: `I've analyzed the engagement data for ${name}. Here's what I found:\n\n• **Email Open Rate**: 65% (Above average)\n• **Response Rate**: 42%\n• **Meeting Frequency**: 2x per month\n• **Last Contact**: 3 days ago\n\n**Sentiment**: Positive - showing interest in our solution.\n\n**Recommendation**: Schedule a follow-up call to discuss next steps.`,
        actions: contextActions[context],
        suggestions: ['Send follow-up email', 'Schedule meeting', 'View detailed analytics'],
      };
    }

    if (input.includes('summarize')) {
      return {
        content: `**Summary for ${name}**\n\n• **Role**: Key stakeholder\n• **Company**: ${context === 'contact' ? 'Target account' : 'Your pipeline'}\n• **Engagement Level**: Moderate to High\n• **Next Best Action**: Follow-up in 2 days\n• **Recent Activity**: Opened last email, visited pricing page\n\nThis contact is actively evaluating our solution.`,
        actions: contextActions[context],
        suggestions: ['Schedule demo call', 'Send case study', 'Update contact score'],
      };
    }

    return {
      content: `I understand you want to ${userInput}. As your AI assistant, I'm here to help with CRM operations, contact management, and providing insights.\n\nWould you like me to:\n• Analyze the current data\n• Suggest next steps\n• Help draft a message\n• Provide recommendations based on best practices?`,
      actions: contextActions[context],
      suggestions: ['Show insights', 'Generate email', 'Suggest next steps'],
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const executeAction = (action: string, payload?: any) => {
    if (onActionExecute) {
      onActionExecute(action, payload);
    } else {
      console.log('Action executed:', action, payload);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-lg transition-all duration-300">
      <div className="p-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Smart Assistant</h3>
              <p className="text-xs text-white/80">
                {contactName !== 'there' ? `Assisting with ${contactName}` : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Toggle actions"
            >
              <Sparkles size={18} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'new',
                    role: 'assistant',
                    content: `Hello! I'm your AI assistant. How can I help you today?`,
                    timestamp: new Date(),
                    suggestions: initialSuggestions,
                  },
                ])
              }
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="New conversation"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                        : message.role === 'system'
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                          <Bot size={12} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>AI Assistant</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>

                    {message.actions && showActions && message.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Quick Actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeAction(action.action, action.payload)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full text-xs font-medium transition-colors"
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.suggestions && message.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs transition-colors"
                            >
                              <MessageSquare size={10} />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Bot size={12} />
                      <span>Typing...</span>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></span>
                      </div>
                      <span className="text-sm text-gray-500">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about your CRM..."
                disabled={isLoading}
                className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>Powered by AI</span>
              <span className="flex items-center gap-1">
                <Sparkles size={10} />
                Context-aware responses
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartAssistant;
