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
import GlassCard from '../components/GlassCard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  FileText,
  Image,
  Video,
  Music,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  Trash2,
  Download,
  Share,
  Sparkles,
  Plus,
  Tag,
  Calendar,
  User,
  TrendingUp,
  Star,
  Heart,
  MessageSquare,
  ThumbsUp,
  Play,
  Pause,
  Volume2,
  Settings
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdDate: string;
  lastModified: string;
  author: string;
  views: number;
  likes: number;
  shares: number;
  engagement: number;
  thumbnail?: string;
  url?: string;
  gpt5Optimization?: {
    suggestedTags: string[];
    predictedEngagement: number;
    contentScore: number;
    recommendations: string[];
  };
}

interface ContentStats {
  totalContent: number;
  publishedContent: number;
  totalViews: number;
  totalEngagement: number;
  averageEngagement: number;
  topPerformingCategory: string;
  aiOptimizationScore: number;
  monthlyGrowth: number;
}

export default function ContentLibraryDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('library');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [contentType, setContentType] = useState('text');
  const [contentCategory, setContentCategory] = useState('announcements');
  const [optimizationGoal, setOptimizationGoal] = useState('engagement');
  const [tagCategory, setTagCategory] = useState('general');
  const [autoTagging, setAutoTagging] = useState('enabled');
  const [contentApproval, setContentApproval] = useState('auto');
  const [analyticsTracking, setAnalyticsTracking] = useState('detailed');
  const [storageLocation, setStorageLocation] = useState('cloud');

  // Mock data
  const mockContent: ContentItem[] = [
    {
      id: '1',
      title: 'Product Launch Announcement',
      description: 'Exciting news about our latest product features and capabilities',
      type: 'text',
      category: 'Announcements',
      tags: ['product', 'launch', 'features'],
      status: 'published',
      createdDate: '2024-01-15',
      lastModified: '2024-01-16',
      author: 'Marketing Team',
      views: 2450,
      likes: 89,
      shares: 34,
      engagement: 0.78,
      gpt5Optimization: {
        suggestedTags: ['innovation', 'technology', 'update'],
        predictedEngagement: 0.82,
        contentScore: 0.85,
        recommendations: ['Add customer testimonials', 'Include product screenshots']
      }
    },
    {
      id: '2',
      title: 'Customer Success Story Video',
      description: 'How our solution transformed a client\'s business operations',
      type: 'video',
      category: 'Case Studies',
      tags: ['success', 'client', 'transformation'],
      status: 'published',
      createdDate: '2024-01-12',
      lastModified: '2024-01-14',
      author: 'Content Team',
      views: 1890,
      likes: 156,
      shares: 67,
      engagement: 0.92,
      thumbnail: '/api/placeholder/400/225',
      url: 'https://example.com/video1'
    },
    {
      id: '3',
      title: 'Industry Trends Report 2024',
      description: 'Comprehensive analysis of emerging trends in our industry',
      type: 'document',
      category: 'Research',
      tags: ['trends', 'analysis', 'industry'],
      status: 'draft',
      createdDate: '2024-01-10',
      lastModified: '2024-01-10',
      author: 'Research Team',
      views: 0,
      likes: 0,
      shares: 0,
      engagement: 0,
      url: 'https://example.com/report1'
    },
    {
      id: '4',
      title: 'Brand Guidelines Infographic',
      description: 'Visual guide for maintaining brand consistency across all materials',
      type: 'image',
      category: 'Branding',
      tags: ['brand', 'guidelines', 'design'],
      status: 'published',
      createdDate: '2024-01-08',
      lastModified: '2024-01-09',
      author: 'Design Team',
      views: 1234,
      likes: 78,
      shares: 23,
      engagement: 0.65,
      thumbnail: '/api/placeholder/400/300',
      url: 'https://example.com/infographic1'
    }
  ];

  const mockStats: ContentStats = {
    totalContent: 156,
    publishedContent: 89,
    totalViews: 45670,
    totalEngagement: 0.73,
    averageEngagement: 0.68,
    topPerformingCategory: 'Case Studies',
    aiOptimizationScore: 0.84,
    monthlyGrowth: 0.15
  };

  const { data: content = mockContent, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content'],
    refetchInterval: 30000,
  });

  const { data: stats = mockStats, isLoading: statsLoading } = useQuery<ContentStats>({
    queryKey: ['/api/content/stats'],
    refetchInterval: 30000,
  });

  const optimizeContent = async (contentItem: ContentItem) => {
    setIsOptimizing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Content: ${contentItem.title}, Description: ${contentItem.description}, Type: ${contentItem.type}, Tags: ${contentItem.tags.join(', ')}`,
        'content-optimization'
      );
      console.log('Content optimization:', result);
    } catch (error) {
      console.error('Failed to optimize content:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="upload-content"
      onClick={() => setActiveTab('upload')}
      className="bg-green-600 hover:bg-green-700"
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload Content
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => optimizeContent(mockContent[0])}
      disabled={isOptimizing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Content Optimizer'}
    </Button>
  ];

  const headerStats = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalContent}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Content</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.publishedContent}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageEngagement * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Engagement</div>
      </div>
    </div>
  );

  const filteredContent = content.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="Smart Content Management System"
      appDescription="AI-powered content creation, optimization, and management with intelligent tagging, engagement analytics, and automated distribution"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          {/* Search and Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Announcements">Announcements</SelectItem>
                  <SelectItem value="Case Studies">Case Studies</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Branding">Branding</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Content Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent.map(item => (
                <GlassCard
                  key={item.id}
                  className="p-4 cursor-pointer hover:border-blue-300"
                  onClick={() => setSelectedContent(item)}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-gray-400">
                        {getTypeIcon(item.type)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6">
              <div className="space-y-4">
                {filteredContent.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>By {item.author}</span>
                        <span>{item.category}</span>
                        <span>{item.views} views</span>
                        <span>{Math.round(item.engagement * 100)}% engagement</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Content
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Drag & drop files here</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  or click to browse files (max 100MB each)
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="content-title">Title</Label>
                  <Input id="content-title" placeholder="Enter content title" />
                </div>
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="content-description">Description</Label>
                  <Textarea
                    id="content-description"
                    placeholder="Describe your content..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="content-category">Category</Label>
                  <Select value={contentCategory} onValueChange={setContentCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcements">Announcements</SelectItem>
                      <SelectItem value="case-studies">Case Studies</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="branding">Branding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content-tags">Tags (comma-separated)</Label>
                  <Input id="content-tags" placeholder="tag1, tag2, tag3" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Upload Content</Button>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Content Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth</span>
                    <span className="font-semibold text-green-600">+{Math.round(stats.monthlyGrowth * 100)}%</span>
                  </div>
                  <Progress value={stats.monthlyGrowth * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Optimization Score</span>
                    <span className="font-semibold">{Math.round(stats.aiOptimizationScore * 100)}%</span>
                  </div>
                  <Progress value={stats.aiOptimizationScore * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Engagement</span>
                    <span className="font-semibold">{Math.round(stats.averageEngagement * 100)}%</span>
                  </div>
                  <Progress value={stats.averageEngagement * 100} className="h-2" />
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Performing Content
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Success Story Video</span>
                    <span className="font-semibold">92% engagement</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Product Launch Announcement</span>
                    <span className="font-semibold">78% engagement</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Brand Guidelines Infographic</span>
                    <span className="font-semibold">65% engagement</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Industry Trends Report</span>
                    <span className="font-semibold">0% engagement</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Content Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="content-to-optimize">Content to Optimize</Label>
                    <Textarea
                      id="content-to-optimize"
                      placeholder="Paste your content here for AI optimization..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optimization-goal">Optimization Goal</Label>
                    <Select value={optimizationGoal} onValueChange={setOptimizationGoal}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engagement">Maximize Engagement</SelectItem>
                        <SelectItem value="seo">SEO Optimization</SelectItem>
                        <SelectItem value="readability">Improve Readability</SelectItem>
                        <SelectItem value="conversion">Drive Conversions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize Content
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Smart Tagging
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="content-for-tags">Content for Tagging</Label>
                    <Textarea
                      id="content-for-tags"
                      placeholder="Paste your content here to generate smart tags..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-category">Tag Category</Label>
                    <Select value={tagCategory} onValueChange={setTagCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="industry">Industry Specific</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Generate Smart Tags
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-blue-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Blog Post</h3>
                    <p className="text-sm text-gray-600">SEO-optimized blog post template</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-green-50">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Social Media</h3>
                    <p className="text-sm text-gray-600">Engaging social media content</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-purple-50">
                  <div className="text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Video Script</h3>
                    <p className="text-sm text-gray-600">Professional video content script</p>
                  </div>
                </GlassCard>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Content Library Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Auto-tagging</Label>
                  <Select value={autoTagging} onValueChange={setAutoTagging}>
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
                  <Label>Content Approval</Label>
                  <Select value={contentApproval} onValueChange={setContentApproval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-approve</SelectItem>
                      <SelectItem value="manual">Manual Review</SelectItem>
                      <SelectItem value="tiered">Tiered Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Analytics Tracking</Label>
                  <Select value={analyticsTracking} onValueChange={setAnalyticsTracking}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <Select value={storageLocation} onValueChange={setStorageLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Content Details Modal */}
      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedContent.type)}
                Content Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</Label>
                  <div className="font-medium">{selectedContent.title}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                  <div className="font-medium capitalize">{selectedContent.type}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <div className="font-medium">{selectedContent.category}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedContent.status)}>
                    {selectedContent.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</Label>
                <div className="text-sm text-gray-700 dark:text-gray-300">{selectedContent.description}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedContent.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedContent.views}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedContent.likes}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedContent.shares}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{Math.round(selectedContent.engagement * 100)}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
                </div>
              </div>

              {selectedContent.gpt5Optimization && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Optimization Insights
                  </Label>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Predicted Engagement:</strong> {Math.round(selectedContent.gpt5Optimization.predictedEngagement * 100)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Additional Tags:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.gpt5Optimization.suggestedTags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Recommendations:</div>
                      <ul className="space-y-1">
                        {selectedContent.gpt5Optimization.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}