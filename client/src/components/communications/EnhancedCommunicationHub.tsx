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
  Frown,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { gpt5Service } from '../../services/gpt5Service';

interface CommunicationActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'sms' | 'video_email';
  contactId: string;
  subject?: string;
  content: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'scheduled';
  priority?: 'low' | 'normal' | 'high';
  duration?: number;
  attachments?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiInsights?: string;
}

interface VideoEmailTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: 'sales' | 'followup' | 'welcome' | 'demo';
  duration: number;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'call_script';
  category: string;
  content: string;
  variables: string[];
}

interface EnhancedCommunicationHubProps {
  selectedContact?: Contact;
  onContactSelect?: (contact: Contact) => void;
}

const EnhancedCommunicationHub: React.FC<EnhancedCommunicationHubProps> = ({
  selectedContact,
  onContactSelect
}) => {
  const { contacts } = useContactStore();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState<CommunicationActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'email' | 'call' | 'meeting' | 'note' | 'sms' | 'video_email'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Video email templates
  const [videoTemplates] = useState<VideoEmailTemplate[]>([
    {
      id: 'sales-pitch',
      name: 'Sales Pitch',
      description: 'Professional product introduction',
      thumbnail: '/templates/sales-thumb.jpg',
      videoUrl: '/templates/sales-pitch.mp4',
      category: 'sales',
      duration: 120
    },
    {
      id: 'follow-up',
      name: 'Follow Up',
      description: 'Gentle follow-up after initial contact',
      thumbnail: '/templates/followup-thumb.jpg',
      videoUrl: '/templates/follow-up.mp4',
      category: 'followup',
      duration: 90
    },
    {
      id: 'demo',
      name: 'Product Demo',
      description: 'Interactive product demonstration',
      thumbnail: '/templates/demo-thumb.jpg',
      videoUrl: '/templates/demo.mp4',
      category: 'demo',
      duration: 180
    }
  ]);

  // Communication templates
  const [communicationTemplates] = useState<CommunicationTemplate[]>([
    {
      id: 'welcome-email',
      name: 'Welcome Email',
      type: 'email',
      category: 'onboarding',
      content: 'Hi {{firstName}}, welcome to {{company}}! We\'re excited to have you on board.',
      variables: ['firstName', 'company']
    },
    {
      id: 'followup-sms',
      name: 'Follow-up SMS',
      type: 'sms',
      category: 'nurture',
      content: 'Hi {{firstName}}, just checking in on our conversation from {{lastMeeting}}. Any questions?',
      variables: ['firstName', 'lastMeeting']
    }
  ]);

  // Sample activities with enhanced data
  useEffect(() => {
    const sampleActivities: CommunicationActivity[] = [
      {
        id: '1',
        type: 'email',
        contactId: '1',
        subject: 'Re: Enterprise Solutions Discussion',
        content: 'Thank you for your interest in our enterprise solutions. I\'ve attached the detailed proposal for your review.',
        timestamp: new Date('2024-01-20T10:30:00'),
        direction: 'outgoing',
        status: 'read',
        priority: 'high',
        sentiment: 'positive',
        aiInsights: 'Strong engagement detected. High probability of conversion.'
      },
      {
        id: '2',
        type: 'call',
        contactId: '1',
        content: 'Discussed pricing and implementation timeline. Follow-up meeting scheduled.',
        timestamp: new Date('2024-01-19T14:15:00'),
        direction: 'outgoing',
        status: 'delivered',
        duration: 25,
        sentiment: 'positive'
      },
      {
        id: '3',
        type: 'sms',
        contactId: '1',
        content: 'Thanks for the call today! Looking forward to our meeting next week.',
        timestamp: new Date('2024-01-19T15:00:00'),
        direction: 'incoming',
        status: 'read',
        sentiment: 'positive'
      },
      {
        id: '4',
        type: 'video_email',
        contactId: '2',
        subject: 'Product Demo',
        content: 'Here\'s a personalized demo of our platform tailored to your needs.',
        timestamp: new Date('2024-01-18T09:00:00'),
        direction: 'outgoing',
        status: 'delivered',
        sentiment: 'neutral'
      }
    ];
    setActivities(sampleActivities);
  }, []);

  // AI-powered sentiment analysis
  const analyzeSentiment = async () => {
    if (activities.length === 0) return;

    setIsAnalyzing(true);
    try {
      const messages = activities.map(a => a.content);
      const analysis = await gpt5Service.analyzeSentiment(messages);

      setSentimentData({
        positive: analysis.filter((s: any) => s.sentiment === 'positive').length,
        neutral: analysis.filter((s: any) => s.sentiment === 'neutral').length,
        negative: analysis.filter((s: any) => s.sentiment === 'negative').length,
        averageScore: analysis.reduce((sum: number, s: any) => sum + s.score, 0) / analysis.length
      });

      // Generate AI suggestions
      const suggestions = await gpt5Service.generateCommunicationSuggestions(activities);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesContact = !selectedContact || activity.contactId === selectedContact.id;
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = !searchTerm ||
      activity.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesContact && matchesType && matchesSearch;
  });

  // Get sentiment icon
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <Heart className="h-4 w-4 text-green-500" />;
      case 'neutral': return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'negative': return <Frown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Communications</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">2.3h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sentiment Score</p>
                <p className="text-2xl font-bold">
                  {sentimentData ? `${Math.round(sentimentData.averageScore * 100)}%` : '--'}
                </p>
              </div>
              <Heart className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Communication Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
          <CardDescription>
            Latest interactions across all channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.slice(0, 5).map((activity) => {
              const contact = Object.values(contacts).find(c => c.id === activity.contactId);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {activity.type === 'email' && <Mail className="h-4 w-4" />}
                    {activity.type === 'call' && <Phone className="h-4 w-4" />}
                    {activity.type === 'sms' && <MessageSquare className="h-4 w-4" />}
                    {activity.type === 'video_email' && <Video className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact?.name || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        {getSentimentIcon(activity.sentiment)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.content}</p>
                    {activity.aiInsights && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        <strong>AI Insight:</strong> {activity.aiInsights}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Video Email Templates Tab
  const VideoEmailTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Video Email Templates</h3>
          <p className="text-sm text-gray-600">Pre-built video content for common scenarios</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Video Preview</p>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.category}</Badge>
                  <span className="text-xs text-gray-500">{template.duration}s</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1">
                    <Play className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // SMS Threading Tab
  const SMSThreadingTab = () => {
    const smsActivities = activities.filter(a => a.type === 'sms');
    const threadedSMS = smsActivities.reduce((threads, sms) => {
      const key = sms.contactId;
      if (!threads[key]) threads[key] = [];
      threads[key].push(sms);
      return threads;
    }, {} as Record<string, CommunicationActivity[]>);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">SMS Conversations</h3>
            <p className="text-sm text-gray-600">Threaded SMS conversations by contact</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New SMS
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(threadedSMS).map(([contactId, messages]) => {
            const contact = Object.values(contacts).find(c => c.id === contactId);
            return (
              <Card key={contactId}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{contact?.name || 'Unknown Contact'}</h4>
                      <p className="text-sm text-gray-600">{messages.length} messages</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.slice(-3).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs p-3 rounded-lg ${
                          message.direction === 'outgoing'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Full Thread
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Enhanced Communication Hub</h2>
              <p className="text-sm text-gray-600">
                AI-powered communication management across all channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={analyzeSentiment}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-5 mx-4 mt-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="video">Video Email</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="email">
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Email Management</h3>
              <p className="mt-1 text-sm text-gray-500">Advanced email features coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="sms">
            <SMSThreadingTab />
          </TabsContent>

          <TabsContent value="video">
            <VideoEmailTemplatesTab />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {sentimentData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Heart className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">{sentimentData.positive}</p>
                        <p className="text-sm text-gray-600">Positive</p>
                      </div>
                      <div className="text-center">
                        <Meh className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">{sentimentData.neutral}</p>
                        <p className="text-sm text-gray-600">Neutral</p>
                      </div>
                      <div className="text-center">
                        <Frown className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-600">{sentimentData.negative}</p>
                        <p className="text-sm text-gray-600">Negative</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default EnhancedCommunicationHub;