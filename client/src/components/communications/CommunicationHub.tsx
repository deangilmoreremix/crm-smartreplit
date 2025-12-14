import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Video,
  Calendar,
  Clock,
  Search,
  Plus,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  Archive,
  Reply,
  Forward,
  Sparkles,
  TrendingUp,
  BarChart3,
  FileText,
  Send,
  Bot,
  Heart,
  Meh,
  Frown
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';
import EmailComposer from './EmailComposer';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { gpt5Service } from '../../services/gpt5Service';

interface CommunicationActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'sms' | 'video_call';
  contactId: string;
  subject?: string;
  content: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'scheduled';
  priority?: 'low' | 'normal' | 'high';
  duration?: number; // for calls/meetings in minutes
  attachments?: string[];
  metadata?: Record<string, any>;
}

interface CommunicationHubProps {
  selectedContact?: Contact;
  onContactSelect?: (contact: Contact) => void;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  selectedContact,
  onContactSelect
}) => {
  const { contacts } = useContactStore();
  
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'email' | 'call' | 'meeting' | 'note'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped'>('timeline');

  // Sample communication activities
  const [activities] = useState<CommunicationActivity[]>([
    {
      id: '1',
      type: 'email',
      contactId: '1',
      subject: 'Re: Enterprise Solutions Discussion',
      content: 'Thank you for your interest in our enterprise solutions. I\'ve attached the detailed proposal for your review.',
      timestamp: new Date('2024-01-20T10:30:00'),
      direction: 'outgoing',
      status: 'read',
      priority: 'high'
    },
    {
      id: '2',
      type: 'call',
      contactId: '1',
      content: 'Discussed pricing and implementation timeline. Follow-up meeting scheduled.',
      timestamp: new Date('2024-01-19T14:15:00'),
      direction: 'outgoing',
      status: 'delivered',
      duration: 25
    },
    {
      id: '3',
      type: 'meeting',
      contactId: '2',
      subject: 'Q3 Planning Meeting',
      content: 'Quarterly planning session to discuss marketing initiatives and budget allocation.',
      timestamp: new Date('2024-01-18T09:00:00'),
      direction: 'outgoing',
      status: 'delivered',
      duration: 60
    },
    {
      id: '4',
      type: 'email',
      contactId: '4',
      subject: 'Welcome to our CRM platform',
      content: 'Welcome! We\'re excited to have you on board. Here\'s everything you need to get started.',
      timestamp: new Date('2024-01-17T16:45:00'),
      direction: 'outgoing',
      status: 'delivered'
    },
    {
      id: '5',
      type: 'note',
      contactId: '3',
      content: 'Contact expressed interest in upgrading to premium plan. Needs approval from finance team.',
      timestamp: new Date('2024-01-16T11:20:00'),
      direction: 'outgoing',
      status: 'delivered'
    }
  ]);

  const contactsArray = Object.values(contacts);

  // Filter activities based on selected contact and filters
  const filteredActivities = activities.filter(activity => {
    const matchesContact = !selectedContact || activity.contactId === selectedContact.id;
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = !searchTerm || 
      activity.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesContact && matchesType && matchesSearch;
  });

  // Group activities by contact for grouped view
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const contact = contactsArray.find(c => c.id === activity.contactId);
    if (!contact) return groups;
    
    if (!groups[contact.id]) {
      groups[contact.id] = {
        contact,
        activities: []
      };
    }
    groups[contact.id].activities.push(activity);
    return groups;
  }, {} as Record<string, { contact: Contact; activities: CommunicationActivity[] }>);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={16} className="text-blue-600" />;
      case 'call': return <Phone size={16} className="text-green-600" />;
      case 'video_call': return <Video size={16} className="text-purple-600" />;
      case 'meeting': return <Calendar size={16} className="text-orange-600" />;
      case 'note': return <MessageSquare size={16} className="text-gray-600" />;
      case 'sms': return <MessageSquare size={16} className="text-indigo-600" />;
      default: return <MessageSquare size={16} className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle size={14} className="text-green-500" />;
      case 'read': return <CheckCircle size={14} className="text-blue-500" />;
      case 'failed': return <AlertCircle size={14} className="text-red-500" />;
      case 'scheduled': return <Clock size={14} className="text-yellow-500" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'normal': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-gray-300';
    }
  };

  const startNewCommunication = (type: 'email' | 'call' | 'meeting') => {
    switch (type) {
      case 'email':
        setShowEmailComposer(true);
        break;
      case 'call':
        if (selectedContact?.phone) {
          window.open(`tel:${selectedContact.phone}`, '_blank');
        }
        break;
      case 'meeting':
        // This would integrate with calendar system
        console.log('Schedule meeting with', selectedContact?.name);
        break;
    }
  };

  const handleActivityAction = (activity: CommunicationActivity, action: 'reply' | 'forward' | 'archive') => {
    switch (action) {
      case 'reply':
        if (activity.type === 'email') {
          setShowEmailComposer(true);
        }
        break;
      case 'forward':
        if (activity.type === 'email') {
          setShowEmailComposer(true);
        }
        break;
      case 'archive':
        console.log('Archive activity:', activity.id);
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Communication Hub</h2>
            <p className="text-sm text-gray-600">
              {selectedContact 
                ? `Communications with ${selectedContact.name}`
                : `${filteredActivities.length} total communications`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedContact && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => startNewCommunication('email')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              >
                <Mail size={16} className="mr-1" />
                Email
              </button>
              <button
                onClick={() => startNewCommunication('call')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
              >
                <Phone size={16} className="mr-1" />
                Call
              </button>
              <button
                onClick={() => startNewCommunication('meeting')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors"
              >
                <Calendar size={16} className="mr-1" />
                Meeting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 sm:mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="call">Calls</option>
              <option value="meeting">Meetings</option>
              <option value="note">Notes</option>
            </select>

            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'timeline'
                    ? 'bg-blue-50 text-blue-600 border-r border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border-r border-gray-300'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'grouped'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grouped
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No communications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedContact 
                ? `Start a conversation with ${selectedContact.name}`
                : 'No communications match your current filters'
              }
            </p>
            {selectedContact && (
              <div className="mt-6">
                <button
                  onClick={() => setShowEmailComposer(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Send Email
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const contact = contactsArray.find(c => c.id === activity.contactId);
              if (!contact) return null;

              return (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(activity.priority)}`}
                  onClick={() => console.log('View activity:', activity.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            </span>
                            {activity.direction === 'incoming' && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Incoming
                              </span>
                            )}
                            {activity.priority === 'high' && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                High Priority
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(activity.status)}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <User size={14} className="mr-1" />
                            <span className="font-medium">{contact.name}</span>
                            {contact.company && (
                              <>
                                <span className="mx-1">•</span>
                                <Building2 size={14} className="mr-1" />
                                <span>{contact.company}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {activity.subject && (
                          <div className="mt-2 text-sm font-medium text-gray-900">
                            {activity.subject}
                          </div>
                        )}
                        
                        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {activity.content}
                        </div>

                        {activity.duration && (
                          <div className="mt-2 text-xs text-gray-500">
                            Duration: {activity.duration} minutes
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-3">
                      {activity.type === 'email' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityAction(activity, 'reply');
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Reply"
                          >
                            <Reply size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityAction(activity, 'forward');
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Forward"
                          >
                            <Forward size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivityAction(activity, 'archive');
                        }}
                        className="p-1 text-gray-400 hover:text-orange-600 rounded"
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Grouped view
          <div className="divide-y divide-gray-200">
            {Object.values(groupedActivities).map(({ contact, activities }) => (
              <div key={contact.id} className="p-4">
                <div 
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => onContactSelect?.(contact)}
                >
                  <div className="flex items-center space-x-3">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.company && (
                        <div className="text-sm text-gray-600">{contact.company}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {activities.length} communication{activities.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="ml-11 space-y-2">
                  {activities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => console.log('View activity:', activity.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {getActivityIcon(activity.type)}
                        <span className="text-sm text-gray-900">{activity.subject || activity.content}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {activities.length > 3 && (
                    <div className="text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View {activities.length - 3} more communications
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        recipient={selectedContact}
      />
    </div>
  );
};

export default CommunicationHub;
