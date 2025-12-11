import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Phone, 
  User, 
  Clock, 
  CheckCheck, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  MoreHorizontal, 
  RefreshCw, 
  X, 
  Calendar, 
  Smile, 
  Paperclip, 
  Image, 
  Mic, 
  Settings
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unread?: number;
  status?: 'online' | 'offline' | 'away';
}

interface Message {
  id: string;
  contactId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isIncoming: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document' | 'audio';
}

const TextMessages: React.FC = () => {
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      lastMessage: "Thanks for the information. I'll review it and get back to you.",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unread: 0,
      status: 'online'
    },
    {
      id: '2',
      name: 'Sarah Williams',
      phone: '+1 (555) 987-6543',
      lastMessage: 'When can we schedule a call to discuss the proposal?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unread: 2,
      status: 'offline'
    },
    {
      id: '3',
      name: 'Michael Johnson',
      phone: '+1 (555) 456-7890',
      lastMessage: "I'm interested in learning more about your services.",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unread: 0,
      status: 'away'
    },
    {
      id: '4',
      name: 'Emily Davis',
      phone: '+1 (555) 234-5678',
      lastMessage: 'The demo was great! Looking forward to the next steps.',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      unread: 0,
      status: 'offline'
    },
    {
      id: '5',
      name: 'Robert Wilson',
      phone: '+1 (555) 876-5432',
      lastMessage: 'Can you send me the pricing details?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      unread: 0,
      status: 'offline'
    }
  ]);
  
  const [messages, setMessages] = useState({
    '1': [
      {
        id: 'm1',
        contactId: '1',
        content: 'Hi John, I wanted to follow up on our conversation yesterday. Have you had a chance to review the proposal?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        status: 'read',
        isIncoming: false
      },
      {
        id: 'm2',
        contactId: '1',
        content: "Yes, I've looked it over. It looks good overall, but I have a few questions about the pricing structure.",
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        status: 'read',
        isIncoming: true
      },
      {
        id: 'm3',
        contactId: '1',
        content: "I'd be happy to clarify. Would you like to schedule a call to discuss, or would you prefer I address your questions via email?",
        timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 minutes ago
        status: 'read',
        isIncoming: false
      },
      {
        id: 'm4',
        contactId: '1',
        content: "Thanks for the information. I'll review it and get back to you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        status: 'read',
        isIncoming: true
      }
    ],
    '2': [
      {
        id: 'm5',
        contactId: '2',
        content: "Hello Sarah, I'm following up on our meeting last week. Did you have any additional questions?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        status: 'delivered',
        isIncoming: false
      },
      {
        id: 'm6',
        contactId: '2',
        content: 'Yes, I was wondering about the implementation timeline. How soon can we get started?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5), // 2.5 hours ago
        status: 'delivered',
        isIncoming: true
      },
      {
        id: 'm7',
        contactId: '2',
        content: 'We can typically begin within 2 weeks of contract signing. I can send you our onboarding schedule if that would be helpful.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.2), // 2.2 hours ago
        status: 'delivered',
        isIncoming: false
      },
      {
        id: 'm8',
        contactId: '2',
        content: 'That would be great. Also, when can we schedule a call to discuss the proposal?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        status: 'delivered',
        isIncoming: true
      }
    ]
  });
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: '',
    phone: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when selected contact changes or new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact, messages]);
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );
  
  // Select a contact
  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Mark messages as read
    if (contact.unread && contact.unread > 0) {
      setContacts(contacts.map(c => 
        c.id === contact.id ? { ...c, unread: 0 } : c
      ));
    }
  };
  
  // Send a message
  const sendMessage = () => {
    if (!selectedContact || !newMessage.trim()) return;
    
    setIsSending(true);
    
    // Create a new message
    const newMsg: Message = {
      id: `m${Date.now()}`,
      contactId: selectedContact.id,
      content: newMessage,
      timestamp: new Date(),
      status: 'sending',
      isIncoming: false
    };
    
    // Add to messages
    const contactMessages = messages[selectedContact.id] || [];
    setMessages({
      ...messages,
      [selectedContact.id]: [...contactMessages, newMsg]
    });
    
    // Update contact's last message
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? {
        ...c,
        lastMessage: newMessage,
        lastMessageTime: new Date()
      } : c
    ));
    
    // Clear input
    setNewMessage('');
    
    // Simulate sending delay
    setTimeout(() => {
      setMessages(prevMessages => {
        const updatedContactMessages = prevMessages[selectedContact.id].map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
        );
        
        return {
          ...prevMessages,
          [selectedContact.id]: updatedContactMessages
        };
      });
      
      setIsSending(false);
    }, 1500);
  };
  
  // Create a new contact
  const createContact = () => {
    if (!newContactData.name || !newContactData.phone) return;
    
    const newContact: Contact = {
      id: `${contacts.length + 1}`,
      name: newContactData.name,
      phone: newContactData.phone,
      status: 'offline'
    };
    
    setContacts([...contacts, newContact]);
    setNewContactData({ name: '', phone: '' });
    setIsCreatingContact(false);
    
    // Select the new contact
    selectContact(newContact);
  };
  
  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Message templates
  const messageTemplates = [
    "Hi, thank you for your interest in our services. How can I help you today?",
    "I wanted to follow up on our previous conversation. Do you have any questions I can answer?",
    "Thank you for your time today. I've attached the information we discussed.",
    "Just checking in to see if you've had a chance to review the proposal I sent.",
    "Would you be available for a quick call this week to discuss next steps?"
  ];
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Text Messages</h1>
        <p className="text-gray-600 mt-1">Send and receive SMS messages with leads and clients</p>
      </header>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 h-[calc(100vh-200px)] min-h-[600px]">
        <div className="flex h-full">
          {/* Contacts sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={() => setIsCreatingContact(true)}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} className="mr-1" />
                New Contact
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {filteredContacts.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => selectContact(contact)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            <User size={20} />
                          </div>
                          {contact.status === 'online' && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{contact.name}</h3>
                            {contact.lastMessageTime && (
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(contact.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500 truncate">
                              {contact.lastMessage || contact.phone}
                            </p>
                            {contact.unread && contact.unread > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">
                                {contact.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No contacts found
                </div>
              )}
            </div>
          </div>
          
          {/* Conversation area */}
          <div className="w-2/3 flex flex-col">
            {selectedContact ? (
              <>
                {/* Contact header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                      <User size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{selectedContact.name}</h2>
                      <p className="text-sm text-gray-500">{selectedContact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    {messages[selectedContact.id]?.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                            message.isIncoming
                              ? 'bg-white border border-gray-200'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="mt-1 flex justify-end items-center space-x-1">
                            <span className="text-xs opacity-75">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!message.isIncoming && (
                              <span>
                                {message.status === 'sending' && (
                                  <Clock size={12} className="text-white opacity-75" />
                                )}
                                {message.status === 'sent' && (
                                  <CheckCheck size={12} className="text-white opacity-75" />
                                )}
                                {message.status === 'delivered' && (
                                  <CheckCheck size={12} className="text-white opacity-75" />
                                )}
                                {message.status === 'read' && (
                                  <CheckCheck size={12} className="text-blue-300" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                </div>
                
                {/* Message input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      ></textarea>
                      
                      <div className="absolute bottom-2 right-2 flex space-x-1">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                          onClick={() => setShowTemplates(!showTemplates)}
                        >
                          <Smile size={20} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                          <Paperclip size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className={`p-3 rounded-full ${
                        !newMessage.trim() || isSending
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSending ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                  
                  {/* Message templates */}
                  {showTemplates && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Responses:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {messageTemplates.map((template, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setNewMessage(template);
                              setShowTemplates(false);
                            }}
                            className="w-full text-left p-2 text-sm hover:bg-gray-100 rounded-md"
                          >
                            {template.length > 60 ? `${template.substring(0, 60)}...` : template}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6">
                  <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
                  <p className="text-gray-500 mb-4">Select a contact to start messaging</p>
                  <button
                    onClick={() => setIsCreatingContact(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus size={18} className="mr-1" />
                    New Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* New Contact Modal */}
      {isCreatingContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Contact</h3>
                <button
                  onClick={() => setIsCreatingContact(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newContactData.name}
                    onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={newContactData.phone}
                    onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreatingContact(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createContact}
                  disabled={!newContactData.name || !newContactData.phone}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextMessages;