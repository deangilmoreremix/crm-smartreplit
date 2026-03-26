/**
 * OpenClaw AI CRM Page
 *
 * This is the main integration page for OpenClaw, an AI-first CRM with 40+ API endpoints.
 * OpenClaw can control all Module Federation apps (Contacts, Pipeline, Calendar, etc.)
 * through natural language commands.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  openclawService,
  openclaw,
  OpenClawMessage,
  OpenClawTool,
  OpenClawHealthStatus,
  OPENCLAW_CRM_TOOLS,
} from '../services/openclawService';
import { unifiedEventSystem, UnifiedEvent } from '../services/unifiedEventSystem';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Brain,
  MessageSquare,
  Wrench,
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Users,
  Target,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Navigation,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: { tool: string; action: string; result?: any }[];
}

// ============================================================================
// Components
// ============================================================================

const HealthIndicator: React.FC<{ status: OpenClawHealthStatus | null }> = ({ status }) => {
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-yellow-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Checking...</span>
      </div>
    );
  }

  const statusConfig = {
    healthy: { color: 'text-green-500', icon: CheckCircle, label: 'Healthy' },
    degraded: { color: 'text-yellow-500', icon: AlertCircle, label: 'Degraded' },
    down: { color: 'text-red-500', icon: XCircle, label: 'Down' },
  };

  const config = statusConfig[status.status] || statusConfig.down;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm">{config.label}</span>
      {status.version && (
        <Badge variant="outline" className="ml-2 text-xs">
          v{status.version}
        </Badge>
      )}
    </div>
  );
};

const ToolCategory: React.FC<{
  category: string;
  tools: OpenClawTool[];
  onExecute: (tool: string, action: string) => void;
}> = ({ category, tools, onExecute }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryIcons: Record<string, React.ReactNode> = {
    Contacts: <Users className="h-4 w-4" />,
    Deals: <Target className="h-4 w-4" />,
    Companies: <Building className="h-4 w-4" />,
    Tasks: <CheckCircle className="h-4 w-4" />,
    Appointments: <Calendar className="h-4 w-4" />,
    Communication: <MessageSquare className="h-4 w-4" />,
    Navigation: <Navigation className="h-4 w-4" />,
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {categoryIcons[category] || <Wrench className="h-4 w-4" />}
          <span className="font-medium">{category}</span>
          <Badge variant="secondary" className="ml-2">
            {tools.length}
          </Badge>
        </div>
        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-2 grid grid-cols-1 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onExecute(tool.id.split(':')[0], tool.id.split(':')[1] || 'execute')}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-sm"
            >
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span className="flex-1 truncate">{tool.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                <p className="text-xs opacity-70 mb-1">Actions executed:</p>
                {message.toolCalls.map((tc, i) => (
                  <div key={i} className="text-xs opacity-80 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {tc.tool}:{tc.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

const OpenClawPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State
  const [healthStatus, setHealthStatus] = useState<OpenClawHealthStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I\'m OpenClaw, your AI-first CRM assistant. I can help you manage contacts, deals, tasks, appointments, and navigate through your CRM. Try commands like:\n\n• "Show my contacts"\n• "Create a new deal for Acme Corp"\n• "Schedule a meeting for tomorrow"\n• "Go to Pipeline"\n\nWhat would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        const status = await openclawService.checkHealth();
        setHealthStatus(status);
      } catch (error) {
        console.error('Failed to check health:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Subscribe to OpenClaw events using registerHandler
  useEffect(() => {
    const handlerId = 'openclaw-page-listener';
    const eventHandler = {
      id: handlerId,
      handler: async (event: UnifiedEvent) => {
        if (event.type === 'OPENCLAW_NAVIGATION') {
          const { page } = event.data as { page: string; params?: Record<string, any> };
          // Handle navigation from OpenClaw
          console.log('OpenClaw navigation:', page, event.data);

          // Navigate based on page
          const routes: Record<string, string> = {
            contacts: '/contacts',
            pipeline: '/pipeline',
            deals: '/deals',
            calendar: '/calendar',
            dashboard: '/dashboard',
            tasks: '/tasks',
            companies: '/companies',
          };

          if (routes[page]) {
            navigate(routes[page]);
          }
        }
      },
      priority: 100,
      filters: { type: 'OPENCLAW_NAVIGATION' },
    };

    const unsubscribe = unifiedEventSystem.registerHandler(eventHandler);

    return () => unsubscribe();
  }, [navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await openclaw.chat(
        messages.map((m) => ({ role: m.role, content: m.content })),
        { currentPage: 'openclaw' }
      );

      // Remove loading message and add response
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        toolCalls: response.tool_calls?.map((tc) => ({
          tool: tc.tool,
          action: tc.action || 'execute',
          result: tc.result,
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      // Remove loading message and add error
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, messages]);

  // Handle tool execution from tools panel
  const handleToolExecute = useCallback(async (tool: string, action: string) => {
    setIsProcessing(true);
    setActiveTab('chat');

    // Add user message about what they're doing
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Execute: ${tool}:${action}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const result = await openclaw.execute(tool, action);

      // Remove loading message
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      const responseMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.success
          ? `Successfully executed ${tool}:${action}`
          : `Failed to execute ${tool}:${action}: ${result.error || 'Unknown error'}`,
        timestamp: new Date(),
        toolCalls: [{ tool, action, result }],
      };

      setMessages((prev) => [...prev, responseMessage]);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle refresh health status
  const handleRefreshHealth = useCallback(async () => {
    setIsInitializing(true);
    try {
      const status = await openclawService.checkHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error('Failed to refresh health:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Group tools by category
  const toolsByCategory = openclawService.getToolsByCategory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    OpenClaw AI
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI-First CRM Assistant</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <HealthIndicator status={healthStatus} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshHealth}
                disabled={isInitializing}
              >
                <RefreshCw className={`h-4 w-4 ${isInitializing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <ChatMessageComponent key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything about your CRM..."
                      value={inputValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInputValue(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                      }
                      disabled={isProcessing}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-purple-600" />
                  Available Tools
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Click any tool to execute it directly. These tools can control all Module
                  Federation apps.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(toolsByCategory).map(([category, tools]) => (
                    <ToolCategory
                      key={category}
                      category={category}
                      tools={tools}
                      onExecute={handleToolExecute}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  How to Use OpenClaw
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Natural Language Commands</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You can control your entire CRM using natural language. Here are some examples:
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-2 font-mono text-sm">
                    <p>"Show me all my contacts"</p>
                    <p>"Create a new deal for Acme Corp worth $50,000"</p>
                    <p>"Schedule a meeting with John tomorrow at 2pm"</p>
                    <p>"Move deal #123 to negotiation stage"</p>
                    <p>"Send email to client about proposal"</p>
                    <p>"Go to Pipeline view"</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Navigation Commands</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    OpenClaw can navigate you to different parts of the CRM:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">"Go to Contacts"</Badge>
                    <Badge variant="outline">"Go to Pipeline"</Badge>
                    <Badge variant="outline">"Go to Calendar"</Badge>
                    <Badge variant="outline">"Go to Dashboard"</Badge>
                    <Badge variant="outline">"Show me Tasks"</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tool Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.keys(toolsByCategory).map((category) => (
                      <Badge key={category} className="justify-center py-2">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Pro Tip
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    OpenClaw can execute multiple actions in sequence. Try combining commands like
                    "Create a contact for John, then create a deal for them, then schedule a
                    follow-up meeting next week."
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OpenClawPage;
