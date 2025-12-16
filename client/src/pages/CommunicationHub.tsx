import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, Send, Users, Search, Filter, Plus, MoreVertical, Check, Clock, AlertCircle, Paperclip, Video, FileText, Network, ClipboardList } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import VideoEmailDashboard from './VideoEmailDashboard';
import PhoneSystemDashboard from './PhoneSystemDashboard';
import TextMessagingDashboard from './TextMessagingDashboard';
import CircleProspectingDashboard from './CircleProspectingDashboard';
import InvoicingDashboard from './InvoicingDashboard';
import FormsSurveysDashboard from './FormsSurveysDashboard';
import PersistentVideoCallButton from '../components/PersistentVideoCallButton';

interface Message {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  type: 'sms' | 'whatsapp' | 'email';
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    type: 'image' | 'document' | 'video';
    name: string;
    url: string;
    size?: number;
  }>;
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  lastMessage?: Date;
  unreadCount: number;
}

interface Template {
  id: string;
  name: string;
  content: string;
  type: 'sms' | 'whatsapp' | 'email';
  category: string;
}

const CommunicationHub: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'video-email' | 'phone' | 'text-messages' | 'templates' | 'broadcast' | 'circle-prospecting' | 'invoicing' | 'forms-surveys'>('messages');
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📱 Communication Hub mounted, activeTab:', activeTab);
  }, []);

  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab);
  }, [activeTab]);
  
  // Filter messages for selected contact
  const contactMessages = messages.filter(msg => 
    selectedContact ? msg.contactId === selectedContact.id : false
  );
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchTerm)) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    setIsSending(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        contactId: selectedContact.id,
        contactName: selectedContact.name,
        contactPhone: selectedContact.phone,
        type: messageType,
        content: newMessage,
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent'
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Update contact's last message time
      setContacts(contacts.map(contact =>
        contact.id === selectedContact.id
          ? { ...contact, lastMessage: new Date() }
          : contact
      ));
      
      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === message.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 2000);
      
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  const useTemplate = (template: Template) => {
    let content = template.content;
    if (selectedContact) {
      content = content.replace('{name}', selectedContact.name);
      // Add more placeholder replacements as needed
    }
    setNewMessage(content);
    setMessageType(template.type);
  };
  
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent': return <Clock size={12} className="text-gray-400" />;
      case 'delivered': return <Check size={12} className="text-gray-400" />;
      case 'read': return <Check size={12} className="text-green-500" />;
      case 'failed': return <AlertCircle size={12} className="text-red-500" />;
      default: return null;
    }
  };
  
  const getTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'sms': return <MessageSquare size={16} className="text-blue-500" />;
      case 'whatsapp': return <MessageSquare size={16} className="text-green-500" />;
      case 'email': return <Mail size={16} className="text-purple-500" />;
      default: return <MessageSquare size={16} className="text-gray-500" />;
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'video-email':
        return <VideoEmailDashboard />;
      case 'phone':
        return <PhoneSystemDashboard />;
      case 'text-messages':
        return <TextMessagingDashboard />;
      case 'circle-prospecting':
        return <CircleProspectingDashboard />;
      case 'invoicing':
        return <InvoicingDashboard />;
      case 'forms-surveys':
        return <FormsSurveysDashboard />;
      case 'templates':
        return (
          <div className="p-4 overflow-y-auto h-full">
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  data-testid={`template-${template.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className="text-xs text-gray-500">{template.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                  <div className="flex items-center mt-2">
                    {getTypeIcon(template.type)}
                    <span className="text-xs text-gray-500 ml-1 capitalize">{template.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'broadcast':
        return (
          <div className="p-4 text-center overflow-y-auto h-full">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Broadcast Messages</h3>
            <p className="text-gray-500 mb-4">Send messages to multiple contacts at once</p>
            <button 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              data-testid="button-create-broadcast"
            >
              <Plus size={16} className="mr-1" />
              Create Broadcast
            </button>
          </div>
        );
      default: // messages tab
        return null; // Will render the existing messaging UI
    }
  };

  return (
    <PageLayout
      title="Communication Hub"
      description="Unified messaging and communication platform"
    >
      <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Tab Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-[60]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {[
              { key: 'messages', label: 'Messages', icon: MessageSquare },
              { key: 'video-email', label: 'Video Email', icon: Video },
              { key: 'phone', label: 'Phone System', icon: Phone },
              { key: 'text-messages', label: 'Text Messages', icon: MessageSquare },
              { key: 'circle-prospecting', label: 'Circle Prospecting', icon: Network },
              { key: 'invoicing', label: 'Invoicing', icon: FileText },
              { key: 'forms-surveys', label: 'Forms & Surveys', icon: ClipboardList },
              { key: 'templates', label: 'Templates', icon: Mail },
              { key: 'broadcast', label: 'Broadcast', icon: Users }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    console.log('🔵 Tab clicked:', tab.key);
                    setActiveTab(tab.key as any);
                  }}
                  className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  <IconComponent size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Communication Hub */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - only show for messages/templates/broadcast tabs */}
        {(activeTab === 'messages' || activeTab === 'templates' || activeTab === 'broadcast') && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'templates' && 'Templates'}
                {activeTab === 'broadcast' && 'Broadcast'}
              </h1>
              <p className="text-sm text-gray-600">
                {activeTab === 'messages' && 'SMS, WhatsApp & Email'}
                {activeTab === 'templates' && 'Message templates'}
                {activeTab === 'broadcast' && 'Send to multiple contacts'}
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'messages' && (
                <>
                  {/* Search */}
                  <div className="p-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        data-testid="input-search-contacts"
                      />
                    </div>
                  </div>
                  
                  {/* Contacts List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedContact?.id === contact.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                        data-testid={`contact-${contact.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{contact.name}</h3>
                          {contact.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {contact.phone && <div>{contact.phone}</div>}
                          {contact.lastMessage && (
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(contact.lastMessage)} {formatTime(contact.lastMessage)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {renderTabContent()}
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Full-width dashboards for video/phone/text/circle-prospecting/invoicing/forms-surveys */}
          {(activeTab === 'video-email' || activeTab === 'phone' || activeTab === 'text-messages' || activeTab === 'circle-prospecting' || activeTab === 'invoicing' || activeTab === 'forms-surveys') ? (
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>
          ) : (
            /* Messages Chat Area */
            selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {selectedContact.phone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {selectedContact.phone}
                          </div>
                        )}
                        {selectedContact.email && (
                          <div className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {selectedContact.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value as any)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                        data-testid="select-message-type"
                      >
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </select>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {contactMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-500">Start a conversation with {selectedContact.name}</p>
                    </div>
                  ) : (
                    contactMessages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.direction === 'outbound'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            {getTypeIcon(message.type)}
                            <span className="text-xs ml-1 opacity-75">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          {message.direction === 'outbound' && (
                            <div className="flex items-center justify-end mt-1">
                              {getStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Type a ${messageType} message...`}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        data-testid="textarea-new-message"
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600" data-testid="button-attach">
                        <Paperclip size={16} />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-send-message"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Contact</h3>
                  <p className="text-gray-500">Choose a contact from the sidebar to start messaging</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

        {/* Persistent Video Call Button */}
        <PersistentVideoCallButton />
      </div>
    </PageLayout>
  );
};

export default CommunicationHub;
