import React, { useState, useEffect, useRef } from 'react';
import openAIService from '../services/openAIService';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Brain, 
  Settings, 
  Calendar, 
  Plus, 
  User, 
  X, 
  Copy, 
  Search,
  Filter,
  SlidersHorizontal,
  Upload,
  ExternalLink,
  Image,
  Phone
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'contact';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  unread: number;
  lastMessage?: string;
  lastActivity?: Date;
  messages: Message[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

const TextMessages: React.FC = () => {
  // OpenAI service for generating content
  const openai = openAIService;
  
  // Mock contacts with message history
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '(555) 123-4567',
      unread: 2,
      lastMessage: 'That sounds great! I\'ll check my calendar.',
      lastActivity: new Date('2025-06-15T14:32:00'),
      messages: [
        {
          id: 'm1',
          sender: 'user',
          content: 'Hi John, are you available for a quick call this week to discuss your needs?',
          timestamp: new Date('2025-06-15T14:30:00'),
          status: 'read'
        },
        {
          id: 'm2',
          sender: 'contact',
          content: 'That sounds great! I\'ll check my calendar.',
          timestamp: new Date('2025-06-15T14:32:00'),
          status: 'read'
        }
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '(555) 987-6543',
      unread: 0,
      lastMessage: 'Thanks for sending the proposal. I\'ll review it today.',
      lastActivity: new Date('2025-06-14T11:15:00'),
      messages: [
        {
          id: 'm1',
          sender: 'user',
          content: 'Hello Jane, I just sent over the proposal we discussed. Let me know if you have any questions!',
          timestamp: new Date('2025-06-14T11:10:00'),
          status: 'read'
        },
        {
          id: 'm2',
          sender: 'contact',
          content: 'Thanks for sending the proposal. I\'ll review it today.',
          timestamp: new Date('2025-06-14T11:15:00'),
          status: 'read'
        }
      ]
    },
    {
      id: '3',
      name: 'Robert Johnson',
      phone: '(555) 456-7890',
      unread: 0,
      lastMessage: 'Yes, that works for me. See you then!',
      lastActivity: new Date('2025-06-13T16:45:00'),
      messages: [
        {
          id: 'm1',
          sender: 'user',
          content: 'Hi Robert, are you available for a demo next Tuesday at 2pm?',
          timestamp: new Date('2025-06-13T16:40:00'),
          status: 'read'
        },
        {
          id: 'm2',
          sender: 'contact',
          content: 'Yes, that works for me. See you then!',
          timestamp: new Date('2025-06-13T16:45:00'),
          status: 'read'
        }
      ]
    }
  ]);
  
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // Template management
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([
    {
      id: 'template-1',
      name: 'Follow-up',
      content: 'Hi {name}, I wanted to follow up on our recent conversation. Do you have any questions I can answer for you?',
      category: 'follow-up',
      variables: ['name']
    },
    {
      id: 'template-2',
      name: 'Appointment Confirmation',
      content: 'Hi {name}, this is just a quick confirmation of our appointment on {date} at {time}. Looking forward to meeting with you!',
      category: 'appointment',
      variables: ['name', 'date', 'time']
    },
    {
      id: 'template-3',
      name: 'New Resource',
      content: 'Hi {name}, I thought you might find this resource helpful based on our conversation: {link}. Let me know what you think!',
      category: 'resource',
      variables: ['name', 'link']
    }
  ]);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const selectedContact = contacts.find(contact => contact.id === selectedContactId);
  
  // Auto-scroll to latest message
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedContact?.messages]);
  
  const selectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    
    // Mark unread messages as read
    setContacts(contacts.map(contact => 
      contact.id === contactId 
        ? { ...contact, unread: 0 } 
        : contact
    ));
    
    setShowTemplates(false);
    setGeneratedText(null);
  };
  
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
    contact.phone.includes(searchText)
  );
  
  const sendMessage = () => {
    if (!selectedContactId || !newMessage.trim()) return;
    
    setIsSending(true);
    
    // Create new message
    const newMessageObj: Message = {
      id: `m${Date.now()}`,
      sender: 'user',
      content: newMessage,
      timestamp: new Date(),
      status: 'sending'
    };
    
    // Update contacts state with the new message
    setContacts(contacts.map(contact => 
      contact.id === selectedContactId 
        ? {
            ...contact,
            messages: [...contact.messages, newMessageObj],
            lastMessage: newMessage,
            lastActivity: new Date()
          }
        : contact
    ));
    
    // Clear input
    setNewMessage('');
    
    // Simulate message delivery
    setTimeout(() => {
      setContacts(prevContacts =>
        prevContacts.map(contact => 
          contact.id === selectedContactId 
            ? {
                ...contact,
                messages: contact.messages.map(message => 
                  message.id === newMessageObj.id
                    ? { ...message, status: 'delivered' }
                    : message
                )
              }
            : contact
        )
      );
      setIsSending(false);
    }, 1500);
  };
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const useTemplate = (templateContent: string) => {
    if (selectedContact) {
      const personalizedContent = templateContent.replace('{name}', selectedContact.name);
      setNewMessage(personalizedContent);
      setShowTemplates(false);
    }
  };
  
  const generateTextSuggestion = async () => {
    if (!selectedContact) return;
    
    setIsGenerating(true);
    setGeneratedText(null);
    
    try {
      // Use the OpenAI service to generate a text message suggestion
      const result = await openai.generateEmail({
        recipient: selectedContact.name,
        purpose: "Short text message follow-up (keep it under 160 characters)",
        tone: 'casual'
      });
      
      // Extract just the body part for text messaging
      let message = result.body;
      
      // If it has multiple paragraphs, just take the first one
      if (message.includes('\n\n')) {
        message = message.split('\n\n')[0];
      }
      
      // Remove any "Subject:" line if present
      if (message.toLowerCase().startsWith('subject:')) {
        message = message.split('\n').slice(1).join('\n').trim();
      }
      
      setGeneratedText(message);
    } catch (error) {
      console.error("Failed to generate text suggestion:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const MessageStatus = ({ status }: { status: Message['status'] }) => {
    switch (status) {
      case 'sending':
        return <Clock size={12} className="text-gray-400" />;
      case 'sent':
        return <Check size={12} className="text-gray-400" />;
      case 'delivered':
        return <div className="flex"><Check size={12} className="text-gray-400" /><Check size={12} className="text-gray-400 -ml-1" /></div>;
      case 'read':
        return <div className="flex"><Check size={12} className="text-blue-500" /><Check size={12} className="text-blue-500 -ml-1" /></div>;
      case 'failed':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Contacts Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Text Messages</h1>
            <button className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => selectContact(contact.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContactId === contact.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                      {contact.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-2">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{contact.lastMessage}</p>
                  </div>
                </div>
              </div>
              {contact.lastActivity && (
                <p className="text-xs text-gray-400 mt-1">{formatDate(contact.lastActivity)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{selectedContact.name}</h2>
                  <p className="text-sm text-gray-500">{selectedContact.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  <MessageSquare size={16} />
                </button>
                <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                  <Phone size={16} />
                </button>
                <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedContact.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">{formatDate(message.timestamp)}</p>
                      {message.sender === 'user' && (
                        <MessageStatus status={message.status} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            {/* AI Suggestion */}
            {generatedText && (
              <div className="p-4 bg-blue-50 border-t border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Brain size={16} className="text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-gray-700">{generatedText}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setNewMessage(generatedText)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => setGeneratedText(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates Panel */}
            {showTemplates && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Message Templates</h3>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {messageTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template.content)}
                      className="text-left p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.content}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={generateTextSuggestion}
                    disabled={isGenerating}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    {isGenerating ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Brain size={16} />
                    )}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                  >
                    {isSending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a contact from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextMessages;