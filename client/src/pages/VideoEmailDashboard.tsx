import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import VideoRecorderModal from '../components/VideoRecorderModal';
import {
  Video,
  Upload,
  Play,
  BarChart3,
  Settings,
  Sparkles,
  Eye,
  ThumbsUp,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Film,
  Mic,
  Camera,
  Edit3,
  Share2,
  FileText
} from 'lucide-react';

interface VideoEmail {
  id: string;
  title: string;
  script: string;
  duration: number;
  thumbnail: string;
  status: 'draft' | 'processing' | 'ready' | 'sent';
  analytics: {
    views: number;
    completionRate: number;
    engagement: number;
    sentDate?: string;
  };
  gpt5Metadata: {
    generatedScript: boolean;
    optimizationScore: number;
    suggestedImprovements: string[];
    tone: string;
    targetAudience: string;
  };
  recipient?: {
    name: string;
    email: string;
    company: string;
  };
}

interface VideoStats {
  totalVideos: number;
  totalViews: number;
  averageEngagement: number;
  conversionRate: number;
  topPerformingVideo: string;
}

export default function VideoEmailDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('videos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoEmail | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [videoQuality, setVideoQuality] = useState('1080p');
  const [defaultDuration, setDefaultDuration] = useState('120');
  const [autoSaveInterval, setAutoSaveInterval] = useState('30');
  const [aiOptimizationLevel, setAiOptimizationLevel] = useState('balanced');

  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoEmail[]>({
    queryKey: ['/api/videos'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<VideoStats>({
    queryKey: ['/api/videos/stats'],
    refetchInterval: 30000,
  });

  const generateVideoScript = async (params: {
    recipient: any;
    purpose: string;
    tone: string;
    length: number;
  }) => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/videos/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: params.recipient,
          purpose: params.purpose,
          tone: params.tone,
          length: params.length
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      setGeneratedScript(data.script);
    } catch (error) {
      console.error('Failed to generate video script:', error);
      setGeneratedScript('Failed to generate script. Please check your API configuration.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const optimizeVideoContent = async (content: string) => {
    try {
      const result = await gpt5Communication.optimizeContent(content, 'video-optimization');
      return result;
    } catch (error) {
      console.error('Failed to optimize video content:', error);
      return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleSaveVideo = async (videoData: any) => {
    try {
      console.log('Saving video:', videoData);
      
      // Send video data to backend
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('recipientName', videoData.recipientName);
      formData.append('recipientEmail', videoData.recipientEmail);
      formData.append('company', videoData.company);
      formData.append('script', videoData.script);
      if (videoData.videoBlob) {
        formData.append('video', videoData.videoBlob, 'video-email.webm');
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoData.title,
          recipientName: videoData.recipientName,
          recipientEmail: videoData.recipientEmail,
          company: videoData.company,
          script: videoData.script
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save video');
      }

      const result = await response.json();
      console.log('Video saved successfully:', result);
      
      // Optionally show a success message
      alert('Video email saved successfully!');
    } catch (error) {
      console.error('Failed to save video:', error);
      alert('Failed to save video email. Please try again.');
    }
  };

  const actionButtons = [
    <Button
      key="record"
      onClick={() => setShowRecorderModal(true)}
      className="bg-blue-600 hover:bg-blue-700"
      data-testid="button-new-video-email"
    >
      <Camera className="h-4 w-4 mr-2" />
      Record Video Email
    </Button>,
    <Button
      key="ai-generate"
      variant="outline"
      onClick={() => generateVideoScript({
        recipient: { name: 'John Doe', company: 'Example Corp' },
        purpose: 'product demonstration',
        tone: 'professional',
        length: 90
      })}
      disabled={isGeneratingScript}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isGeneratingScript ? 'Generating...' : 'AI Script Generator'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalVideos}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Videos</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalViews.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageEngagement * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Engagement</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.conversionRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
      </div>
    </div>
  ) : null;

  return (
    <CommunicationDashboard
      appName="AI Video Communication Suite"
      appDescription="Create, analyze, and optimize video emails with AI-powered insights, automated transcription, and performance analytics"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="lg" variant="secondary">
                      <Play className="h-6 w-6 mr-2" />
                      Preview
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(video.status)}>
                      {video.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{video.title}</h3>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{video.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span>{video.analytics.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement:</span>
                      <span>{Math.round(video.analytics.engagement * 100)}%</span>
                    </div>
                  </div>

                  {video.gpt5Metadata.generatedScript && (
                    <div className="mt-3 flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        AI Generated
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Product Demo', description: 'Showcase your product features', duration: '2-3 min' },
              { name: 'Welcome Message', description: 'Warm introduction for new customers', duration: '1-2 min' },
              { name: 'Follow-up', description: 'Re-engage previous prospects', duration: '1 min' },
              { name: 'Testimonial', description: 'Share customer success stories', duration: '1-2 min' },
              { name: 'Tutorial', description: 'Guide users through processes', duration: '3-5 min' },
              { name: 'Announcement', description: 'Share important updates', duration: '1 min' }
            ].map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4 flex items-center justify-center">
                    <Video className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{template.duration}</span>
                    <Button size="sm">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {statsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Views</span>
                      <span className="font-semibold">{stats.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Completion</span>
                      <span className="font-semibold">{Math.round(stats.averageEngagement * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-semibold">{Math.round(stats.conversionRate * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performing Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">{stats.topPerformingVideo}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Views</span>
                        <span>245</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>Engagement</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analytics Available</h3>
              <p className="text-gray-600 dark:text-gray-400">Create and send some video emails to see analytics</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Script Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input id="recipient" placeholder="John Doe, Acme Corp" />
                  </div>
                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Product Demo</SelectItem>
                        <SelectItem value="welcome">Welcome Message</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => generateVideoScript({
                      recipient: { name: 'John Doe', company: 'Acme Corp' },
                      purpose: 'product demonstration',
                      tone: 'professional',
                      length: 90
                    })}
                    disabled={isGeneratingScript}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Content Optimizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your video script here for AI optimization..."
                  rows={6}
                />
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Optimize Content
                </Button>
              </CardContent>
            </Card>
          </div>

          {generatedScript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{generatedScript}</pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit Script
                  </Button>
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-1" />
                    Create Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Video Quality</Label>
                  <Select value={videoQuality} onValueChange={setVideoQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="1080p">1080p</SelectItem>
                      <SelectItem value="4k">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Duration</Label>
                  <Select value={defaultDuration} onValueChange={setDefaultDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-save Interval</Label>
                  <Select value={autoSaveInterval} onValueChange={setAutoSaveInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Optimization Level</Label>
                  <Select value={aiOptimizationLevel} onValueChange={setAiOptimizationLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Recorder Modal */}
      <VideoRecorderModal
        open={showRecorderModal}
        onOpenChange={setShowRecorderModal}
        onSave={handleSaveVideo}
      />
    </CommunicationDashboard>
  );
}