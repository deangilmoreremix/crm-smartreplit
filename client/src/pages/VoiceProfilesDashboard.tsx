import React, { useState, useEffect } from 'react';
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
  Mic,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Radio,
  Speaker,
  Headphones,
  Music,
  Zap,
  Brain,
  MessageSquare,
  Users,
  TrendingUp,
  Star,
  Heart,
  ThumbsUp,
  Eye,
  Calendar,
  Filter,
  Search
} from 'lucide-react';

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  voiceType: 'male' | 'female' | 'neutral';
  language: string;
  accent: string;
  age: string;
  personality: string;
  useCase: string;
  status: 'active' | 'training' | 'inactive';
  createdDate: string;
  lastUsed: string;
  usageCount: number;
  quality: number;
  gpt5Optimization?: {
    voiceClarity: number;
    naturalness: number;
    emotionalRange: number;
    languageAccuracy: number;
    recommendations: string[];
  };
}

interface VoiceStats {
  totalProfiles: number;
  activeProfiles: number;
  totalUsage: number;
  averageQuality: number;
  mostUsedProfile: string;
  monthlyGrowth: number;
  aiOptimizationScore: number;
  languageSupport: number;
}

export default function VoiceProfilesDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profiles');
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [voiceType, setVoiceType] = useState('male');
  const [voiceLanguage, setVoiceLanguage] = useState('english');
  const [voiceAccent, setVoiceAccent] = useState('neutral');
  const [voiceAge, setVoiceAge] = useState('adult');
  const [voicePersonality, setVoicePersonality] = useState('professional');
  const [voiceUseCase, setVoiceUseCase] = useState('business');
  const [optimizationType, setOptimizationType] = useState('naturalness');
  const [targetEmotion, setTargetEmotion] = useState('neutral');
  const [autoTraining, setAutoTraining] = useState('enabled');
  const [qualityThreshold, setQualityThreshold] = useState('high');
  const [languageDetection, setLanguageDetection] = useState('auto');
  const [voiceStorage, setVoiceStorage] = useState('cloud');

  // Mock data
  const mockProfiles: VoiceProfile[] = [
    {
      id: '1',
      name: 'Professional Male',
      description: 'Clear, confident voice perfect for business presentations and corporate communications',
      voiceType: 'male',
      language: 'English',
      accent: 'American',
      age: 'Adult',
      personality: 'Professional',
      useCase: 'Business Presentations',
      status: 'active',
      createdDate: '2024-01-15',
      lastUsed: '2024-01-20',
      usageCount: 245,
      quality: 0.92,
      gpt5Optimization: {
        voiceClarity: 0.95,
        naturalness: 0.88,
        emotionalRange: 0.82,
        languageAccuracy: 0.96,
        recommendations: ['Slightly increase warmth for better engagement', 'Consider adding more dynamic intonation']
      }
    },
    {
      id: '2',
      name: 'Friendly Female',
      description: 'Warm, approachable voice ideal for customer service and educational content',
      voiceType: 'female',
      language: 'English',
      accent: 'British',
      age: 'Adult',
      personality: 'Friendly',
      useCase: 'Customer Service',
      status: 'active',
      createdDate: '2024-01-12',
      lastUsed: '2024-01-19',
      usageCount: 189,
      quality: 0.89,
      gpt5Optimization: {
        voiceClarity: 0.91,
        naturalness: 0.94,
        emotionalRange: 0.89,
        languageAccuracy: 0.93,
        recommendations: ['Excellent naturalness score', 'Consider adding more authoritative tone for leadership content']
      }
    },
    {
      id: '3',
      name: 'Youthful Neutral',
      description: 'Modern, energetic voice suitable for tech tutorials and social media content',
      voiceType: 'neutral',
      language: 'English',
      accent: 'Australian',
      age: 'Young Adult',
      personality: 'Energetic',
      useCase: 'Tech Tutorials',
      status: 'training',
      createdDate: '2024-01-10',
      lastUsed: '2024-01-18',
      usageCount: 67,
      quality: 0.78,
      gpt5Optimization: {
        voiceClarity: 0.85,
        naturalness: 0.76,
        emotionalRange: 0.91,
        languageAccuracy: 0.88,
        recommendations: ['Training in progress - naturalness improving', 'Focus on clarity for technical terms']
      }
    }
  ];

  const mockStats: VoiceStats = {
    totalProfiles: 12,
    activeProfiles: 8,
    totalUsage: 3456,
    averageQuality: 0.87,
    mostUsedProfile: 'Professional Male',
    monthlyGrowth: 0.23,
    aiOptimizationScore: 0.91,
    languageSupport: 15
  };

  const { data: profiles = mockProfiles, isLoading: profilesLoading } = useQuery<VoiceProfile[]>({
    queryKey: ['/api/voice/profiles'],
    refetchInterval: 30000,
  });

  const { data: stats = mockStats, isLoading: statsLoading } = useQuery<VoiceStats>({
    queryKey: ['/api/voice/stats'],
    refetchInterval: 30000,
  });

  const optimizeVoiceProfile = async (profile: VoiceProfile) => {
    setIsOptimizing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Voice Profile: ${profile.name}, Type: ${profile.voiceType}, Language: ${profile.language}, Personality: ${profile.personality}, Use Case: ${profile.useCase}`,
        'voice-optimization'
      );
      console.log('Voice profile optimization:', result);
    } catch (error) {
      console.error('Failed to optimize voice profile:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getVoiceTypeIcon = (type: string) => {
    switch (type) {
      case 'male': return <Users className="h-5 w-5" />;
      case 'female': return <Users className="h-5 w-5" />;
      case 'neutral': return <Users className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'training': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="create-profile"
      onClick={() => setActiveTab('create')}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Voice Profile
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => optimizeVoiceProfile(mockProfiles[0])}
      disabled={isOptimizing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Voice Optimization'}
    </Button>
  ];

  const headerStats = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalProfiles}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Profiles</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.activeProfiles}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Profiles</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.totalUsage.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Usage</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageQuality * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Quality</div>
      </div>
    </div>
  );

  const filteredProfiles = profiles.filter(profile => {
    if (searchQuery && !profile.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !profile.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && profile.voiceType !== filterType) return false;
    if (filterLanguage !== 'all' && profile.language !== filterLanguage) return false;
    if (filterStatus !== 'all' && profile.status !== filterStatus) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="AI Voice Assistant Studio"
      appDescription="Create, customize, and optimize AI voice profiles with advanced natural language processing, emotional intelligence, and multi-language support"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profiles">Voice Profiles</TabsTrigger>
          <TabsTrigger value="create">Create Profile</TabsTrigger>
          <TabsTrigger value="studio">Voice Studio</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
          {/* Search and Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search voice profiles..."
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
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Voice Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <GlassCard
                key={profile.id}
                className="p-6 cursor-pointer hover:border-blue-300"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${
                    profile.voiceType === 'male' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    profile.voiceType === 'female' ? 'bg-pink-100 dark:bg-pink-900/20' :
                    'bg-purple-100 dark:bg-purple-900/20'
                  }`}>
                    {getVoiceTypeIcon(profile.voiceType)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{profile.name}</h3>
                    <Badge className={getStatusColor(profile.status)}>
                      {profile.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {profile.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Language:</span>
                    <span>{profile.language}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Personality:</span>
                    <span>{profile.personality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                    <span>{Math.round(profile.quality * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                    <span>{profile.usageCount} times</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <GlassCard className="p-6">
            <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Plus className="h-5 w-5" />
                Create New Voice Profile
              </h3>
            </div>
            <div className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="profile-name">Profile Name</Label>
                  <Input id="profile-name" placeholder="Enter profile name" />
                </div>
                <div>
                  <Label htmlFor="voice-type">Voice Type</Label>
                  <Select value={voiceType} onValueChange={setVoiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-language">Language</Label>
                  <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="portuguese">Portuguese</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-accent">Accent</Label>
                  <Select value={voiceAccent} onValueChange={setVoiceAccent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="british">British</SelectItem>
                      <SelectItem value="australian">Australian</SelectItem>
                      <SelectItem value="canadian">Canadian</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-age">Age Group</Label>
                  <Select value={voiceAge} onValueChange={setVoiceAge}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="teen">Teen</SelectItem>
                      <SelectItem value="young-adult">Young Adult</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-personality">Personality</Label>
                  <Select value={voicePersonality} onValueChange={setVoicePersonality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="voice-description">Description</Label>
                  <Textarea
                    id="voice-description"
                    placeholder="Describe the voice profile and its intended use..."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="voice-use-case">Primary Use Case</Label>
                  <Select value={voiceUseCase} onValueChange={setVoiceUseCase}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business Presentations</SelectItem>
                      <SelectItem value="customer-service">Customer Service</SelectItem>
                      <SelectItem value="education">Education & Training</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                      <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Create Voice Profile</Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="studio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Recording Studio
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                      isRecording ? 'bg-red-100 dark:bg-red-900/20 animate-pulse' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Mic className={`h-8 w-8 ${isRecording ? 'text-red-600' : 'text-gray-600'}`} />
                    </div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      {isRecording ? 'Recording in progress...' : 'Click record to start capturing voice samples'}
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setIsRecording(!isRecording)}
                      className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                      {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    <Button variant="outline" disabled={!isRecording && !isPlaying}>
                      <Play className="h-4 w-4 mr-2" />
                      Play Sample
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Recording Quality</Label>
                      <Progress value={85} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Excellent</span>
                        <span>85%</span>
                      </div>
                    </div>

                    <div>
                      <Label>Voice Clarity</Label>
                      <Progress value={92} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Clear</span>
                        <span>92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Voice Analysis
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Radio className="h-8 w-8 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">120 BPM</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Speech Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">0.85</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Naturalness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">95%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Clarity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">Medium</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pitch Range</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Voice Profile Performance
                </h3>
              </div>
              <div className="px-0 pb-0">
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
                    <span className="text-sm">Average Quality</span>
                    <span className="font-semibold">{Math.round(stats.averageQuality * 100)}%</span>
                  </div>
                  <Progress value={stats.averageQuality * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Language Support</span>
                    <span className="font-semibold">{stats.languageSupport} languages</span>
                  </div>
                  <Progress value={(stats.languageSupport / 20) * 100} className="h-2" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Performing Profiles
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Professional Male</span>
                    <span className="font-semibold">245 uses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Friendly Female</span>
                    <span className="font-semibold">189 uses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Youthful Neutral</span>
                    <span className="font-semibold">67 uses</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Voice Optimization
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voice-text">Text to Optimize</Label>
                    <Textarea
                      id="voice-text"
                      placeholder="Enter text to optimize for voice synthesis..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optimization-type">Optimization Type</Label>
                    <Select value={optimizationType} onValueChange={setOptimizationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="naturalness">Naturalness</SelectItem>
                        <SelectItem value="clarity">Clarity</SelectItem>
                        <SelectItem value="emotional">Emotional Range</SelectItem>
                        <SelectItem value="speed">Speech Speed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize Voice
                  </Button>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Emotional Intelligence
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emotion-text">Text for Emotional Analysis</Label>
                    <Textarea
                      id="emotion-text"
                      placeholder="Enter text to analyze emotional content..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-emotion">Target Emotion</Label>
                    <Select value={targetEmotion} onValueChange={setTargetEmotion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="happy">Happy</SelectItem>
                        <SelectItem value="sad">Sad</SelectItem>
                        <SelectItem value="excited">Excited</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Emotions
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Voice Profile Settings</h3>
            </div>
            <div className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Auto-training</Label>
                  <Select value={autoTraining} onValueChange={setAutoTraining}>
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
                  <Label>Quality Threshold</Label>
                  <Select value={qualityThreshold} onValueChange={setQualityThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (70%)</SelectItem>
                      <SelectItem value="medium">Medium (80%)</SelectItem>
                      <SelectItem value="high">High (90%)</SelectItem>
                      <SelectItem value="premium">Premium (95%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language Detection</Label>
                  <Select value={languageDetection} onValueChange={setLanguageDetection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="manual">Manual Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Voice Storage</Label>
                  <Select value={voiceStorage} onValueChange={setVoiceStorage}>
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
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Voice Profile Details Modal */}
      {selectedProfile && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getVoiceTypeIcon(selectedProfile.voiceType)}
                Voice Profile Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</Label>
                  <div className="font-medium">{selectedProfile.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Voice Type</Label>
                  <div className="font-medium capitalize">{selectedProfile.voiceType}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Language</Label>
                  <div className="font-medium">{selectedProfile.language}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedProfile.status)}>
                    {selectedProfile.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</Label>
                <div className="text-sm text-gray-700 dark:text-gray-300">{selectedProfile.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Personality</Label>
                  <div className="font-medium">{selectedProfile.personality}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Use Case</Label>
                  <div className="font-medium">{selectedProfile.useCase}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedProfile.usageCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Usage Count</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{Math.round(selectedProfile.quality * 100)}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedProfile.accent}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Accent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{selectedProfile.age}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Age Group</div>
                </div>
              </div>

              {selectedProfile.gpt5Optimization && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Optimization Insights
                  </Label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Voice Clarity:</strong> {Math.round(selectedProfile.gpt5Optimization.voiceClarity * 100)}%
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <strong>Naturalness:</strong> {Math.round(selectedProfile.gpt5Optimization.naturalness * 100)}%
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm text-purple-800 dark:text-purple-200">
                          <strong>Emotional Range:</strong> {Math.round(selectedProfile.gpt5Optimization.emotionalRange * 100)}%
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-sm text-orange-800 dark:text-orange-200">
                          <strong>Language Accuracy:</strong> {Math.round(selectedProfile.gpt5Optimization.languageAccuracy * 100)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Recommendations:</div>
                      <ul className="space-y-1">
                        {selectedProfile.gpt5Optimization.recommendations.map((rec, index) => (
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