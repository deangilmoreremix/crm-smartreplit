import React, { useState, useEffect, useRef } from 'react';
import { useOpenAIFunctions } from '../../services/openAiFunctionService';
import AIToolContent from '../shared/AIToolContent';
import { Bot, User, Send, RefreshCw, Zap, Database, Calendar, CheckSquare, Settings, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'function' | 'system';
  content: string;
  timestamp: Date;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

interface FunctionExecutionInfo {
  name: string;
  arguments: any;
  result: any;
}

const FunctionAssistantContent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [functionLogs, setFunctionLogs] = useState<FunctionExecutionInfo[]>([]);
  const [showFunctionLogs, setShowFunctionLogs] = useState(false);
  const [enabledFunctions, setEnabledFunctions] = useState<string[]>([
    'searchDeals',
    'searchContacts',
    'createTask',
    'scheduleFollowUp',
    'getContactInfo',
    'getDealInfo'
  ]);
  const [showSettings, setShowSettings] = useState(false);
  
  const functionService = useOpenAIFunctions();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Add welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: "Hello! I'm your AI sales assistant with access to your CRM data. I can help you find contacts, look up deal information, create tasks, and schedule follow-ups. What would you like help with today?",
        timestamp: new Date()
      }
    ]);
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);
    
    try {
      // Format previous messages for the API
      const previousMessages = messages
        .filter(msg => msg.role !== 'system') // Exclude system messages
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
          function_call: msg.functionCall ? {
            name: msg.functionCall.name,
            arguments: msg.functionCall.arguments
          } : undefined
        }));
      
      // Call the assistant with function capabilities
      const response = await functionService.salesAssistantWithFunctions(
        input.trim(),
        "You have access to this user's CRM data through functions.",
        previousMessages
      );
      
      // Process function calls that might have happened
      // Note: In a real implementation, we'd track the actual function calls and results
      // that were exchanged with OpenAI. For demo purposes, we'll simulate this.
      
      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content || 'I processed your request.',
        timestamp: new Date(),
        functionCall: response.function_call ? {
          name: response.function_call.name,
          arguments: response.function_call.arguments
        } : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      console.error('Error with function assistant:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleFunctionStatus = (functionName: string) => {
    setEnabledFunctions(prev => {
      if (prev.includes(functionName)) {
        return prev.filter(fn => fn !== functionName);
      } else {
        return [...prev, functionName];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-start">
          <Zap className="text-indigo-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-indigo-800">Function-Calling Assistant</h3>
            <p className="text-sm text-indigo-700 mt-1">
              Chat with an AI assistant that can perform actual CRM actions through function calling. This assistant can search your data, create tasks, schedule appointments, and more.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={false}
        error={error}
        result={null}
        loadingMessage=""
        resultTitle=""
      >
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {/* Header with settings */}
          <div className="flex justify-between items-center p-3 bg-indigo-50 border-b border-gray-200">
            <div className="flex items-center">
              <Zap size={18} className="text-indigo-600 mr-2" />
              <span className="font-medium">CRM Function-Enabled AI Assistant</span>
            </div>
            
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Assistant Settings"
            >
              <Settings size={18} />
            </button>
          </div>
          
          {/* Settings panel */}
          {showSettings && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Available Functions</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white transition-colors">
                  <div className="flex items-center">
                    <Database size={16} className="text-blue-500 mr-2" />
                    <span className="text-sm">Search Deals</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enabledFunctions.includes('searchDeals')}
                    onChange={() => toggleFunctionStatus('searchDeals')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white transition-colors">
                  <div className="flex items-center">
                    <User size={16} className="text-green-500 mr-2" />
                    <span className="text-sm">Search Contacts</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enabledFunctions.includes('searchContacts')}
                    onChange={() => toggleFunctionStatus('searchContacts')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white transition-colors">
                  <div className="flex items-center">
                    <CheckSquare size={16} className="text-amber-500 mr-2" />
                    <span className="text-sm">Create Task</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enabledFunctions.includes('createTask')}
                    onChange={() => toggleFunctionStatus('createTask')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white transition-colors">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-purple-500 mr-2" />
                    <span className="text-sm">Schedule Follow Up</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enabledFunctions.includes('scheduleFollowUp')}
                    onChange={() => toggleFunctionStatus('scheduleFollowUp')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white transition-colors">
                  <div className="flex items-center">
                    <Database size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm">Get Contact/Deal Info</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enabledFunctions.includes('getContactInfo') && enabledFunctions.includes('getDealInfo')}
                    onChange={() => {
                      if (enabledFunctions.includes('getContactInfo')) {
                        setEnabledFunctions(prev => 
                          prev.filter(fn => fn !== 'getContactInfo' && fn !== 'getDealInfo')
                        );
                      } else {
                        setEnabledFunctions(prev => 
                          [...prev, 'getContactInfo', 'getDealInfo']
                        );
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => setShowFunctionLogs(!showFunctionLogs)} 
                className="mt-4 text-xs text-indigo-600 hover:text-indigo-800"
              >
                {showFunctionLogs ? 'Hide' : 'Show'} Function Execution Logs
              </button>
            </div>
          )}
          
          {/* Function execution logs panel */}
          {showFunctionLogs && (
            <div className="p-3 bg-gray-800 text-gray-200 text-xs font-mono max-h-40 overflow-y-auto">
              <div className="mb-2 text-gray-400 border-b border-gray-700 pb-1">Function Execution Logs</div>
              {functionLogs.length === 0 ? (
                <div className="text-gray-400">No functions executed yet</div>
              ) : (
                functionLogs.map((log, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-green-400">→ {log.name}({JSON.stringify(log.arguments)})</div>
                    <div className="text-blue-400">← {JSON.stringify(log.result)}</div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Messages area */}
          <div className="p-4 h-96 overflow-y-auto">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.role === 'function'
                        ? 'bg-amber-50 text-gray-800 border border-amber-200'
                        : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'user' ? (
                      <User size={14} className="mr-1" />
                    ) : message.role === 'function' ? (
                      <Zap size={14} className="mr-1 text-amber-500" />
                    ) : (
                      <Bot size={14} className="mr-1" />
                    )}
                    <span className="text-xs opacity-80">
                      {message.role === 'user' ? 'You' : 
                       message.role === 'function' ? `Function: ${message.name}` : 'Assistant'}
                    </span>
                    <span className="ml-2 text-xs opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {message.functionCall && (
                    <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                      <div className="font-bold">Function Call:</div>
                      <div className="font-mono">{message.functionCall.name}()</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t border-gray-200">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask me to find deals, create tasks, schedule meetings..."
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isProcessing}
              />
              <button 
                type="submit"
                disabled={isProcessing || !input.trim()} 
                className={`px-4 py-2 rounded-md text-white ${
                  isProcessing || !input.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isProcessing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            
            {/* Function status indicator */}
            <div className="mt-2 flex justify-end">
              <div className="flex items-center text-xs text-indigo-600">
                <Zap size={12} className="mr-1" />
                <span>
                  {enabledFunctions.length === functionService.functionSchemas.length ?
                    'All functions enabled' :
                    `${enabledFunctions.length} functions enabled`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AIToolContent>
    </div>
  );
};

export default FunctionAssistantContent;