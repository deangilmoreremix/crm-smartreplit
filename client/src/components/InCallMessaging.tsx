import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Smile } from 'lucide-react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useTheme } from '../contexts/ThemeContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'remote';
  content: string;
  timestamp: Date;
}

interface InCallMessagingProps {
  isVisible: boolean;
  onClose: () => void;
  remoteParticipantName: string;
}

const InCallMessaging: React.FC<InCallMessagingProps> = ({ 
  isVisible, 
  onClose, 
  remoteParticipantName 
}) => {
  const { peer } = useVideoCall();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup data channel for messaging
  useEffect(() => {
    if (!peer) return;

    // Check if peer has data channel support
    try {
      // Listen for data from remote peer
      peer.on('data', (data) => {
        try {
          const messageData = JSON.parse(data.toString());
          if (messageData.type === 'chat') {
            const newMessage: ChatMessage = {
              id: Date.now().toString(),
              sender: 'remote',
              content: messageData.content,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
          }
        } catch (error) {
          console.error('Error parsing message data:', error);
        }
      });

      // Check connection status
      peer.on('connect', () => {
        setIsConnected(true);
      });

      peer.on('close', () => {
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Error setting up data channel:', error);
    }
  }, [peer]);

  const sendMessage = () => {
    if (!inputValue.trim() || !peer || !isConnected) return;

    try {
      // Send message to remote peer
      const messageData = {
        type: 'chat',
        content: inputValue.trim(),
        timestamp: new Date().toISOString()
      };

      peer.send(JSON.stringify(messageData));

      // Add message to local state
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        content: inputValue.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Data channel may not be available.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed right-4 top-20 w-80 h-96 ${
      isDark ? 'bg-gray-900/95' : 'bg-white/95'
    } backdrop-blur-xl border ${
      isDark ? 'border-white/20' : 'border-gray-200'
    } rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col`}>
      
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <MessageSquare size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chat with {remoteParticipantName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          }`}
        >
          <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className={`p-3 border-b ${isDark ? 'border-white/10 bg-yellow-500/20' : 'border-gray-200 bg-yellow-50'}`}>
          <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
            Setting up messaging connection...
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
              } rounded-lg px-3 py-2`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-blue-100' 
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'bg-gray-800 border-white/10 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Quick Reactions */}
        <div className="flex items-center space-x-2 mt-2">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick:</span>
          {['👍', '👎', '😄', '🎉'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputValue(prev => prev + emoji);
              }}
              disabled={!isConnected}
              className={`text-sm hover:bg-white/10 rounded px-1 py-0.5 transition-colors disabled:opacity-50`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InCallMessaging;