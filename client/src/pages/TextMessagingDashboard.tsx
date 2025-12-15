import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  MessageSquare,
  Send,
  Phone,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Zap,
  BarChart3,
  Clock,
  Target,
  Shield,
  RefreshCw
} from 'lucide-react';

interface MessageProvider {
  id: string;
  name: string;
  apiKey: string;
  costPerMessage: number;
  supportedFeatures: string[];
  status: 'active' | 'inactive' | 'error';
  deliveryRate: number;
  responseTime: number;
}

interface Message {
  id: string;
  content: string;
  recipient: string;
  provider: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
  gpt5Suggestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high';
}

interface MessagingStats {
  totalMessages: number;
  deliveredMessages: number;
  deliveryRate: number;
  averageResponseTime: number;
  totalCost: number;
  costPerMessage: number;
  activeProviders: number;
}

export default function TextMessagingDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('messages');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('twilio');
  const [messageContent, setMessageContent] = useState('');
  const [recipient, setRecipient] = useState('');
  const [gpt5Suggestions, setGpt5Suggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseTone, setResponseTone] = useState('professional');
  const [optimizationGoal, setOptimizationGoal] = useState('engagement');
  const [autoFailover, setAutoFailover] = useState('enabled');
  const [messageTemplates, setMessageTemplates] = useState('enabled');
  const [deliveryNotifications, setDeliveryNotifications] = useState('important');

  const { data: providers = [], isLoading: providersLoading } = useQuery<MessageProvider[]>({
    queryKey: ['/api/messaging/providers'],
    refetchInterval: 30000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messaging/messages'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MessagingStats>({
    queryKey: ['/api/messaging/stats'],
    refetchInterval: 30000,
  });

  const generateSmartReply = async () => {
    setIsGenerating(true);
    try {
      const response = await gpt5Communication.generateSMSReply({
        message: messageContent,
        context: 'Customer inquiry about product demo',
        tone: 'professional'
      });
      setGpt5Suggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to generate smart reply:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          recipient: recipient,
          provider: selectedProvider
        })
      });

      if (response.ok) {
        setShowComposeModal(false);
        setMessageContent('');
        setRecipient('');
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'delivered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'sent': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const actionButtons = [
    <Button
      key="compose"
      onClick={() => setShowComposeModal(true)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Compose Message
    </Button>,
    <Button
      key="providers"
      variant="outline"
      onClick={() => setShowProviderModal(true)}
    >
      <Settings className="h-4 w-4 mr-2" />
      Manage Providers
    </Button>,
    <Button
      key="ai-assist"
      variant="outline"
      onClick={generateSmartReply}
      disabled={isGenerating || !messageContent.trim()}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isGenerating ? 'Generating...' : 'AI Assist'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{Math.round(stats.deliveryRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.averageResponseTime}s</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">${stats.costPerMessage.toFixed(4)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Cost per Message</div>
      </div>
    </div>
  ) : null;

  return (
    <CommunicationDashboard
      appName="Intelligent Messaging Platform"
      appDescription="AI-powered SMS and MMS with multi-provider support, smart responses, and automated optimization"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          {/* Message List */}
          <GlassCard className="p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5" />
                Recent Messages
              </h3>
            </div>
            <div>
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                        <Badge variant="outline">
                          {message.provider}
                        </Badge>
                        {message.sentiment && (
                          <Badge className={getSentimentColor(message.sentiment)}>
                            {message.sentiment}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>To: {message.recipient}</span>
                        <span>{new Date(message.sentAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(provider => (
              <GlassCard key={provider.id} className="relative p-6">
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Phone className="h-5 w-5" />
                      {provider.name}
                    </h3>
                    <Badge className={getStatusColor(provider.status)}>
                      {provider.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Cost/Message:</span>
                      <div className="font-semibold">${provider.costPerMessage.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Delivery Rate:</span>
                      <div className="font-semibold">{Math.round(provider.deliveryRate * 100)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                      <div className="font-semibold">{provider.responseTime}s</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Features:</span>
                      <div className="font-semibold">{provider.supportedFeatures.length}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Delivery Rate</span>
                      <span>{Math.round(provider.deliveryRate * 100)}%</span>
                    </div>
                    <Progress value={provider.deliveryRate * 100} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Configure
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Test
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Messages Sent</span>
                    <span className="font-semibold">{stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Messages Delivered</span>
                    <span className="font-semibold text-green-600">{stats.deliveredMessages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Cost</span>
                    <span className="font-semibold">${stats.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Providers</span>
                    <span className="font-semibold">{stats.activeProviders}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Cost/Message</span>
                    <span className="font-semibold">${stats.costPerMessage.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Budget Used</span>
                    <span className="font-semibold">$8.75</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Projected Monthly Cost</span>
                    <span className="font-semibold">$12.50</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Smart Reply Generator
                </CardTitle>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="message-context">Message Context</Label>
                    <Textarea
                      id="message-context"
                      placeholder="Paste the incoming message here..."
                      rows={4}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tone">Response Tone</Label>
                    <Select value={responseTone} onValueChange={setResponseTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={generateSmartReply}
                    disabled={isGenerating || !messageContent.trim()}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Smart Reply'}
                  </Button>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Message Optimizer
                </CardTitle>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="optimize-content">Message to Optimize</Label>
                    <Textarea
                      id="optimize-content"
                      placeholder="Enter your message for AI optimization..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal">Optimization Goal</Label>
                    <Select value={optimizationGoal} onValueChange={setOptimizationGoal}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engagement">Increase Engagement</SelectItem>
                        <SelectItem value="response">Improve Response Rate</SelectItem>
                        <SelectItem value="conversion">Boost Conversion</SelectItem>
                        <SelectItem value="clarity">Enhance Clarity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Message
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>

            <GlassCard>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  AI-Generated Suggestions
                </CardTitle>
              </div>
              <div>
                <div className="space-y-3">
                  {gpt5Suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{suggestion}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => setMessageContent(suggestion)}
                        >
                          Use This
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard>
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <CardTitle>Messaging Settings</CardTitle>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-Failover</Label>
                  <Select value={autoFailover} onValueChange={setAutoFailover}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message Templates</Label>
                  <Select value={messageTemplates} onValueChange={setMessageTemplates}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Notifications</Label>
                  <Select value={deliveryNotifications} onValueChange={setDeliveryNotifications}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="important">Important Only</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Compose Message Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Phone Number</Label>
                <Input
                  id="recipient"
                  placeholder="+1234567890"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Message Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.filter(p => p.status === 'active').map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} (${provider.costPerMessage.toFixed(4)}/msg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                maxLength={160}
              />
              <div className="text-right text-sm text-gray-500">
                {messageContent.length}/160 characters
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowComposeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!messageContent.trim() || !recipient.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CommunicationDashboard>
  );
}