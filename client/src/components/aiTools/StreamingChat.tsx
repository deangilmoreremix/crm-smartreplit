import React, { useState, useEffect, useRef } from 'react';
import { useOpenAIStream } from '../../services/openaiStreamService';
import { Send, User, Bot, RefreshCw, Clock, Copy, Check, X, Zap, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface StreamingChatProps {
  systemPrompt?: string;
  initialMessage?: string;
  placeholder?: string;
  modelOptions?: { value: string; label: string }[];
}

const StreamingChat: React.FC<StreamingChatProps> = ({
  systemPrompt = "You are an AI sales assistant helping with CRM tasks, sales strategies, and customer communication.",
  initialMessage = "Hello! I'm your AI sales assistant. How can I help you today?",
  placeholder = "Type your message here...",
  modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gemma-2-27b-it', label: 'Gemma 2 27B' },
    { value: 'gemma-2-9b-it', label: 'Gemma 2 9B' }
  ]
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [showSettings, setShowSettings] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState<'normal' | 'faster' | 'instant'>('normal');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamService = useOpenAIStream();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: typingSpeed === 'instant' ? 'auto' : 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    
    // Create a placeholder for the assistant response
    const assistantMsgId = Date.now() + 1 + '';
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    if (typingSpeed === 'instant') {
      try {
        // For instant mode, get the full response first then show it
        const fullResponse = await streamService.streamChatCompletion(
          input.trim(),
          systemPrompt,
          () => {}, // Empty callback since we don't update incrementally
          selectedModel
        );
        
        setMessages(prev => [...prev, userMessage, {
          id: assistantMsgId,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error getting response:', error);
      } finally {
        setIsStreaming(false);
      }
    } else {
      setMessages(prev => [...prev, userMessage, initialAssistantMessage]);
      
      try {
        // Stream the response
        await streamService.streamChatCompletion(
          input.trim(),
          systemPrompt,
          (token) => {
            setMessages(currentMessages => {
              const messageIndex = currentMessages.findIndex(m => m.id === assistantMsgId);
              if (messageIndex === -1) return currentMessages;
              
              const updatedMessages = [...currentMessages];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: updatedMessages[messageIndex].content + token
              };
              
              return updatedMessages;
            });
          },
          selectedModel
        );
      } catch (error) {
        console.error('Error streaming response:', error);
      } finally {
        setIsStreaming(false);
      }
    }
  };
  
  const getSpeedDelay = () => {
    switch (typingSpeed) {
      case 'faster': return 10;
      case 'instant': return 0;
      default: return 20; // normal
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 overflow-hidden bg-white shadow-md">
      {/* Header with model selection */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200">
        <div className="flex items-center">
          <Zap size={20} className="text-indigo-600 mr-2" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-gray-200 overflow-hidden"
          >
            <div className="p-4 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    {modelOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Speed</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTypingSpeed('normal')}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        typingSpeed === 'normal' 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setTypingSpeed('faster')}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        typingSpeed === 'faster' 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Faster
                    </button>
                    <button
                      onClick={() => setTypingSpeed('instant')}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        typingSpeed === 'instant' 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Instant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] relative group ${
                message.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-t-lg rounded-bl-lg' 
                  : 'bg-white text-gray-800 rounded-t-lg rounded-br-lg border border-gray-200 shadow-sm'
              } px-4 py-3`}>
                <div className="flex items-center mb-1">
                  {message.role === 'user' ? (
                    <User size={14} className="mr-1" />
                  ) : (
                    <Bot size={14} className="mr-1" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-xs ml-2 opacity-50">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <p className="whitespace-pre-line text-sm">{message.content}</p>
                
                {/* Copy button - only for assistant messages */}
                {message.role === 'assistant' && message.content && (
                  <button 
                    onClick={() => copyToClipboard(message.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {isStreaming && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-1 text-indigo-500 text-sm bg-indigo-50 rounded-full px-3 py-1">
                <RefreshCw size={14} className="animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={placeholder}
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isStreaming}
          />
          <button 
            type="submit"
            disabled={isStreaming || !input.trim()} 
            className={`p-2 rounded-md text-white ${
              isStreaming || !input.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isStreaming ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Responses stream in real-time</span>
          </div>
          <span className="text-indigo-600">
            {selectedModel.includes('gemini') ? 'Powered by Gemini AI' : 'Powered by OpenAI'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StreamingChat;