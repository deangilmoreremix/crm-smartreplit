import React, { useState, useEffect, useRef } from 'react';
import { useOpenAIAssistants } from '../../services/openaiAssistantsService';
import { User, Bot, Send, RefreshCw, Plus, Settings, X, Save, MessagesSquare, Clock, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface AIAssistantChatProps {
  assistantId?: string;
}

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ assistantId: propAssistantId }) => {
  const assistants = useOpenAIAssistants();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(propAssistantId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(!propAssistantId);
  const [runId, setRunId] = useState<string | null>(null);
  
  // Settings form state
  const [assistantName, setAssistantName] = useState('Sales Assistant');
  const [assistantInstructions, setAssistantInstructions] = useState('You are a helpful sales assistant that helps with CRM tasks, deal analysis, and sales strategy.');
  const [selectedTools, setSelectedTools] = useState<string[]>(['retrieval']);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize thread on first load
  useEffect(() => {
    initializeThread();
  }, []);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Poll for updates when there's an active run
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (runId && threadId) {
      intervalId = setInterval(() => {
        checkRunStatus();
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [runId, threadId]);
  
  const initializeThread = async () => {
    try {
      if (!threadId) {
        const thread = await assistants.createThread();
        setThreadId(thread.id);
        console.log('New thread created:', thread.id);
        
        // Add welcome message
        setMessages(prev => [
          ...prev,
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I\'m your AI sales assistant. How can I help you today?',
            createdAt: new Date()
          }
        ]);
      }
    } catch (err) {
      setError('Error initializing chat thread');
      console.error(err);
    }
  };
  
  const createNewAssistant = async () => {
    if (!assistantName || !assistantInstructions) {
      setError('Assistant name and instructions are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const assistant = await assistants.createAssistant(
        assistantName,
        assistantInstructions,
        selectedTools
      );
      
      setAssistantId(assistant.id);
      setShowSettings(false);
      
      // Add confirmation message
      setMessages(prev => [
        ...prev,
        {
          id: 'assistant-created',
          role: 'assistant',
          content: `I've been configured as your ${assistantName}. How can I assist you with your sales tasks?`,
          createdAt: new Date()
        }
      ]);
    } catch (err) {
      console.error('Error creating assistant:', err);
      setError('Error creating assistant');
    } finally {
      setIsLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || !threadId || !assistantId) return;
    
    // Add user message to the local state first for immediate feedback
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Send message to the thread
      await assistants.addMessageToThread(threadId, input);
      
      // Run the assistant
      const run = await assistants.runAssistant(threadId, assistantId);
      setRunId(run.id);
      
    } catch (err) {
      setError('Error sending message');
      console.error(err);
      setIsLoading(false);
    }
  };
  
  const checkRunStatus = async () => {
    if (!threadId || !runId) return;
    
    try {
      const run = await assistants.getRunStatus(threadId, runId);
      
      if (run.status === 'completed') {
        // Get the latest messages
        const threadMessages = await assistants.getThreadMessages(threadId);
        
        if (threadMessages.data.length > 0) {
          // Convert the latest assistant message to our format
          const latestAssistantMessage = threadMessages.data.find(m => m.role === 'assistant');
          
          if (latestAssistantMessage && latestAssistantMessage.content[0].type === 'text') {
            const newMessage: Message = {
              id: latestAssistantMessage.id,
              role: 'assistant',
              content: latestAssistantMessage.content[0].text.value,
              createdAt: new Date(latestAssistantMessage.created_at * 1000)
            };
            
            // Check if we already have this message
            const messageExists = messages.some(m => m.id === newMessage.id);
            if (!messageExists) {
              setMessages(prev => [...prev, newMessage]);
            }
          }
        }
        
        setRunId(null);
        setIsLoading(false);
      } else if (run.status === 'failed') {
        setError('The assistant encountered an error');
        setRunId(null);
        setIsLoading(false);
      }
      // For other statuses (queued, in_progress), keep waiting
      
    } catch (err) {
      setError('Error checking message status');
      console.error(err);
      setRunId(null);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 overflow-hidden bg-white shadow-md transition-all duration-200 transform hover:shadow-lg">
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border-b border-indigo-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center">
              <Sparkles size={18} className="mr-2 text-indigo-600" />
              Assistant Configuration
            </h3>
            {assistantId && (
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                Assistant Name
              </label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                placeholder="e.g., Sales Strategy Assistant"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                Instructions
              </label>
              <textarea
                value={assistantInstructions}
                onChange={(e) => setAssistantInstructions(e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                placeholder="Describe what the assistant should do and how it should behave..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                Capabilities
              </label>
              <div className="space-y-2 bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="retrieval"
                    checked={selectedTools.includes('retrieval')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTools(prev => [...prev, 'retrieval']);
                      } else {
                        setSelectedTools(prev => prev.filter(tool => tool !== 'retrieval'));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="retrieval" className="ml-2 block text-sm text-gray-900">
                    Knowledge Retrieval
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="code_interpreter"
                    checked={selectedTools.includes('code_interpreter')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTools(prev => [...prev, 'code_interpreter']);
                      } else {
                        setSelectedTools(prev => prev.filter(tool => tool !== 'code_interpreter'));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="code_interpreter" className="ml-2 block text-sm text-gray-900">
                    Data Analysis
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="function"
                    checked={selectedTools.includes('function')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTools(prev => [...prev, 'function']);
                      } else {
                        setSelectedTools(prev => prev.filter(tool => tool !== 'function'));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="function" className="ml-2 block text-sm text-gray-900">
                    Function Calling
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={createNewAssistant}
                disabled={isLoading || !assistantName || !assistantInstructions}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="inline mr-2 animate-spin" />
                    Creating Assistant...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Create Assistant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div ref={messageContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 bg-[linear-gradient(to_right,#f9fafb_1px,transparent_1px),linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] bg-[size:20px_20px]">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`my-2 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-800 border border-indigo-100 shadow-md'
                }`}
              >
                <div className="flex items-center mb-2">
                  {message.role === 'assistant' ? (
                    <div className="bg-indigo-100 rounded-full p-1 mr-2">
                      <Bot size={14} className="text-indigo-600" />
                    </div>
                  ) : (
                    <div className="bg-blue-100 rounded-full p-1 mr-2">
                      <User size={14} className="text-blue-600" />
                    </div>
                  )}
                  <span className="text-xs opacity-75 font-medium">
                    {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                  </span>
                  <span className="text-xs ml-2 opacity-50">
                    {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
          
          {isLoading && !runId && messages.length === 0 && (
            <div className="flex justify-center my-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
              </div>
            </div>
          )}
          
          {isLoading && runId && (
            <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-indigo-100">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot size={18} className="text-indigo-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center p-1">
                  <div className="animate-pulse h-2 w-2 bg-indigo-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex space-x-2 items-center">
                  <p className="text-indigo-700 font-medium text-sm">Assistant is thinking</p>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 opacity-75">Using sophisticated AI to analyze your request...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-4 mt-2 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-start">
              <div className="bg-red-100 p-1 rounded-full mr-2 mt-0.5">
                <X size={14} className="text-red-600" />
              </div>
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => setShowSettings(true)}
            className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center text-sm font-medium"
          >
            <Settings size={16} className="mr-1" />
            Assistant Settings
          </button>
          
          {assistantId && (
            <button
              onClick={() => {
                // Reset conversation
                setMessages([{
                  id: 'welcome-reset',
                  role: 'assistant',
                  content: 'Hello! I\'m your AI sales assistant. How can I help you today?',
                  createdAt: new Date()
                }]);
                
                // Create a new thread
                initializeThread();
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <MessagesSquare size={16} className="mr-1" />
              New Conversation
            </button>
          )}
        </div>
        
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
            disabled={isLoading || !assistantId}
            placeholder={
              !assistantId 
                ? "Configure the assistant first" 
                : isLoading 
                  ? "Please wait..." 
                  : "Ask me anything about sales, CRM, or your deals..."
            }
            className="w-full p-4 pr-16 border rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm disabled:bg-gray-100 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !assistantId}
            className="absolute right-1.5 top-1.5 p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isLoading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        
        {!assistantId && !showSettings && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <Plus size={18} className="mr-1.5" />
              Configure Assistant
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3 px-1 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock size={12} />
            <span>Available 24/7</span>
          </div>
          <div className="text-right">
            Powered by GPT-4o
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChat;