import React, { useState, useEffect, useRef } from 'react';
import { createConversation, generateAI, sendConversationMessage } from '../../services/aiGenerate';
import {
  Bot,
  Send,
  RefreshCw,
  Plus,
  Settings,
  X,
  Save,
  Zap,
  PauseCircle,
  StopCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Users,
  Calendar,
  Mail,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  trigger: 'manual' | 'schedule' | 'event';
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    days?: string[];
  };
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  workflow?: AgentWorkflow;
  createdAt: Date;
}

const WORKFLOW_AGENT_INSTRUCTIONS = `You are an AI workflow automation agent that helps users create, manage, and execute automated business workflows.

You can help with:
- Creating multi-step automated workflows for sales, marketing, and customer service
- Scheduling and triggering workflows based on events or time
- Monitoring workflow execution and performance
- Integrating with CRM data, email systems, and communication tools
- Analyzing workflow results and suggesting optimizations

When users request workflows, provide detailed step-by-step plans and ask clarifying questions to ensure the workflow meets their specific needs.`;

const WORKFLOW_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'steps'],
  properties: {
    name: { type: 'string', description: 'Short workflow name' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'action', 'description'],
        properties: {
          name: { type: 'string' },
          action: { type: 'string', description: 'Short snake_case action, e.g. query_crm, send_email, create_task' },
          description: { type: 'string' },
        },
      },
    },
  },
} as const;

const AgentWorkflowChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeWorkflowAgent();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeWorkflowAgent = async () => {
    try {
      // The workflow agent runs on an OpenAI Responses API conversation; its instructions go with each turn
      setAssistantId('workflow-agent');
      setThreadId(await createConversation('workflow-agent'));

      // Welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Hello! I'm your AI Workflow Automation Agent. I can help you create, manage, and execute automated workflows for your business processes.\n\nHere are some things I can help you with:\n• Create lead nurturing sequences\n• Automate follow-up communications\n• Schedule periodic data analysis\n• Set up customer onboarding workflows\n• Build sales pipeline automation\n\nWhat kind of workflow would you like to create?",
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize workflow agent:', error);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !threadId || !assistantId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if the message is requesting workflow creation
      if (
        input.toLowerCase().includes('create workflow') ||
        input.toLowerCase().includes('build workflow')
      ) {
        try {
          const workflow = await generateWorkflowFromPrompt(input);
          setWorkflows((prev) => [...prev, workflow]);
          setActiveWorkflow(workflow);
        } catch (planError) {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-plan-error`,
              role: 'assistant',
              content: `I couldn't generate the workflow plan: ${planError instanceof Error ? planError.message : 'unknown error'}`,
              createdAt: new Date(),
            },
          ]);
          return;
        }
      }

      // Send to the workflow agent (conversation keeps the history)
      const response = await sendConversationMessage(threadId, userMessage.content, {
        system: WORKFLOW_AGENT_INSTRUCTIONS,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: response.responseId || `${Date.now()}-assistant`,
          role: 'assistant',
          content: response.content,
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'The AI request failed',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // The plan is written by the AI from the user's request (no canned templates)
  const generateWorkflowFromPrompt = async (prompt: string): Promise<AgentWorkflow> => {
    const { data } = await generateAI({
      system: WORKFLOW_AGENT_INSTRUCTIONS,
      prompt: `Design a workflow plan of 3 to 7 steps for this request:\n${prompt}`,
      schema: WORKFLOW_PLAN_SCHEMA as unknown as Record<string, unknown>,
      schemaName: 'workflow_plan',
    });
    if (!data?.steps?.length) throw new Error('The AI returned no workflow steps');

    return {
      id: `workflow_${Date.now()}`,
      name: String(data.name || 'Workflow'),
      description: prompt,
      steps: data.steps.map((step: any, index: number) => ({
        id: `step_${index + 1}`,
        name: String(step.name),
        action: String(step.action),
        parameters: { description: String(step.description || '') },
        status: 'pending' as const,
      })),
      status: 'draft',
      trigger: 'manual',
      createdAt: new Date(),
      runCount: 0,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
      case 'active':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Workflow Agent</h2>
              <p className="text-sm opacity-90">Create and manage automated workflows</p>
            </div>
          </div>
          <button
            onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                      : message.role === 'system'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 mr-2" />
                    ) : message.role === 'system' ? (
                      <Zap className="h-4 w-4 mr-2" />
                    ) : (
                      <div className="h-4 w-4 bg-white/30 rounded-full mr-2" />
                    )}
                    <span className="text-xs font-medium opacity-75">
                      {message.role === 'assistant'
                        ? 'Workflow Agent'
                        : message.role === 'system'
                          ? 'System'
                          : 'You'}
                    </span>
                    <span className="text-xs ml-2 opacity-50">
                      {message.createdAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Agent is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Describe the workflow you want to create..."
                className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 p-2 text-purple-600 hover:text-purple-800 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setInput('Create a lead nurturing workflow')}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
              >
                Lead Nurturing
              </button>
              <button
                onClick={() => setInput('Build a follow-up automation')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
              >
                Follow-up Automation
              </button>
              <button
                onClick={() => setInput('Create email campaign workflow')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
              >
                Email Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Panel */}
        {showWorkflowBuilder && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Workflows</h3>
              <button
                onClick={() => setShowWorkflowBuilder(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{workflow.name}</h4>
                    {getStatusIcon(workflow.status)}
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{workflow.description}</p>

                  <div className="space-y-1 mb-3">
                    {workflow.steps.map((step) => (
                      <div key={step.id} className="flex items-center text-xs">
                        {getStatusIcon(step.status)}
                        <span className="ml-2">{step.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Created: {workflow.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))}

              {workflows.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No workflows created yet</p>
                  <p className="text-xs">Chat with the agent to create your first workflow</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentWorkflowChat;
