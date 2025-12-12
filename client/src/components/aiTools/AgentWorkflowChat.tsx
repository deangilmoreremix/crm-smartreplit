
import React, { useState, useEffect, useRef } from 'react';
import { useOpenAIAssistants } from '../../services/openaiAssistantsService';
import { Bot, Send, RefreshCw, Plus, Settings, X, Save, Zap, PlayCircle, PauseCircle, StopCircle, CheckCircle, Clock, AlertCircle, Target, Users, Calendar, Mail } from 'lucide-react';

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

const AgentWorkflowChat: React.FC = () => {
  const assistants = useOpenAIAssistants();
  
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
      // Create a specialized workflow agent
      const assistant = await assistants.createAssistant(
        'Workflow Automation Agent',
        `You are an AI workflow automation agent that helps users create, manage, and execute automated business workflows. 
        
        You can help with:
        - Creating multi-step automated workflows for sales, marketing, and customer service
        - Scheduling and triggering workflows based on events or time
        - Monitoring workflow execution and performance
        - Integrating with CRM data, email systems, and communication tools
        - Analyzing workflow results and suggesting optimizations
        
        When users request workflows, provide detailed step-by-step plans and ask clarifying questions to ensure the workflow meets their specific needs.`,
        ['function_calling', 'code_interpreter']
      );
      
      setAssistantId(assistant.id);
      
      const thread = await assistants.createThread();
      setThreadId(thread.id);
      
      // Welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI Workflow Automation Agent. I can help you create, manage, and execute automated workflows for your business processes.\n\nHere are some things I can help you with:\n• Create lead nurturing sequences\n• Automate follow-up communications\n• Schedule periodic data analysis\n• Set up customer onboarding workflows\n• Build sales pipeline automation\n\nWhat kind of workflow would you like to create?',
        createdAt: new Date()
      }]);
      
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
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Check if the message is requesting workflow creation
      if (input.toLowerCase().includes('create workflow') || input.toLowerCase().includes('build workflow')) {
        const workflow = await generateWorkflowFromPrompt(input);
        if (workflow) {
          setWorkflows(prev => [...prev, workflow]);
          setActiveWorkflow(workflow);
        }
      }
      
      // Send to AI assistant
      await assistants.addMessageToThread(threadId, input);
      const run = await assistants.runAssistant(threadId, assistantId);
      
      // Poll for response
      const response = await pollForResponse(run.id);
      if (response) {
        setMessages(prev => [...prev, {
          id: response.id,
          role: 'assistant',
          content: response.content,
          createdAt: new Date()
        }]);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const pollForResponse = async (runId: string): Promise<any> => {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const run = await assistants.getRunStatus(threadId!, runId);
        
        if (run.status === 'completed') {
          const messages = await assistants.getThreadMessages(threadId!);
          const latestMessage = messages.data.find(m => m.role === 'assistant');
          
          if (latestMessage && latestMessage.content[0].type === 'text') {
            return {
              id: latestMessage.id,
              content: latestMessage.content[0].text.value
            };
          }
        } else if (run.status === 'failed') {
          throw new Error('Assistant run failed');
        }
        
        await new Promise(resolve => // TODO: Replace with real AI implementation);
        attempts++;
      } catch (error) {
        console.error('Error polling for response:', error);
        break;
      }
    }
    
    return null;
  };
  
  const generateWorkflowFromPrompt = async (prompt: string): Promise<AgentWorkflow | null> => {
    try {
      // Simple workflow generation based on prompt keywords
      const workflowId = `workflow_${Date.now()}`;
      const workflow: AgentWorkflow = {
        id: workflowId,
        name: extractWorkflowName(prompt),
        description: prompt,
        steps: generateStepsFromPrompt(prompt),
        status: 'draft',
        trigger: 'manual',
        createdAt: new Date(),
        runCount: 0
      };
      
      return workflow;
    } catch (error) {
      console.error('Error generating workflow:', error);
      return null;
    }
  };
  
  const extractWorkflowName = (prompt: string): string => {
    if (prompt.toLowerCase().includes('lead')) return 'Lead Nurturing Workflow';
    if (prompt.toLowerCase().includes('follow')) return 'Follow-up Automation';
    if (prompt.toLowerCase().includes('email')) return 'Email Campaign Workflow';
    if (prompt.toLowerCase().includes('onboard')) return 'Customer Onboarding';
    if (prompt.toLowerCase().includes('sales')) return 'Sales Pipeline Automation';
    return 'Custom Workflow';
  };
  
  const generateStepsFromPrompt = (prompt: string): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];
    
    if (prompt.toLowerCase().includes('lead')) {
      steps.push(
        {
          id: 'step_1',
          name: 'Identify New Leads',
          action: 'query_crm',
          parameters: { filter: 'new_leads', timeframe: '24h' },
          status: 'pending'
        },
        {
          id: 'step_2',
          name: 'Send Welcome Email',
          action: 'send_email',
          parameters: { template: 'welcome', personalized: true },
          status: 'pending'
        },
        {
          id: 'step_3',
          name: 'Schedule Follow-up',
          action: 'create_task',
          parameters: { type: 'follow_up', delay: '3_days' },
          status: 'pending'
        }
      );
    } else if (prompt.toLowerCase().includes('follow')) {
      steps.push(
        {
          id: 'step_1',
          name: 'Check Deal Status',
          action: 'query_deals',
          parameters: { status: 'proposal_sent' },
          status: 'pending'
        },
        {
          id: 'step_2',
          name: 'Send Follow-up',
          action: 'send_email',
          parameters: { template: 'follow_up', timing: 'after_3_days' },
          status: 'pending'
        }
      );
    }
    
    return steps;
  };
  
  const executeWorkflow = async (workflow: AgentWorkflow) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflow.id 
        ? { ...w, status: 'active', lastRun: new Date() }
        : w
    ));
    
    // Simulate workflow execution
    for (const step of workflow.steps) {
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? {
              ...w, 
              steps: w.steps.map(s => 
                s.id === step.id ? { ...s, status: 'running' } : s
              )
            }
          : w
      ));
      
      // Simulate step execution
      await new Promise(resolve => // TODO: Replace with real AI implementation);
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? {
              ...w, 
              steps: w.steps.map(s => 
                s.id === step.id 
                  ? { ...s, status: 'completed', result: `${step.name} completed successfully` }
                  : s
              )
            }
          : w
      ));
    }
    
    setWorkflows(prev => prev.map(w => 
      w.id === workflow.id 
        ? { ...w, status: 'completed', runCount: w.runCount + 1 }
        : w
    ));
    
    // Add completion message
    setMessages(prev => [...prev, {
      id: `completion_${Date.now()}`,
      role: 'system',
      content: `✅ Workflow "${workflow.name}" completed successfully! All ${workflow.steps.length} steps executed.`,
      createdAt: new Date()
    }]);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': case 'active': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
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
                      {message.role === 'assistant' ? 'Workflow Agent' : 
                       message.role === 'system' ? 'System' : 'You'}
                    </span>
                    <span className="text-xs ml-2 opacity-50">
                      {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  
                  <div className="flex space-x-2">
                    {workflow.status === 'draft' && (
                      <button
                        onClick={() => executeWorkflow(workflow)}
                        className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <PlayCircle className="h-3 w-3 inline mr-1" />
                        Run
                      </button>
                    )}
                    {workflow.status === 'active' && (
                      <button className="flex-1 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">
                        <PauseCircle className="h-3 w-3 inline mr-1" />
                        Pause
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Runs: {workflow.runCount} | Created: {workflow.createdAt.toLocaleDateString()}
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
