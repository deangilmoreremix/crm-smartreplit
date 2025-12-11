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
  Users,
  MapPin,
  Search,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  Eye,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Filter,
  Zap,
  Activity,
  Globe,
  Network,
  UserPlus
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  company: string;
  title: string;
  location: string;
  industry: string;
  connections: number;
  engagement: number;
  lastActivity: string;
  status: 'prospect' | 'contacted' | 'engaged' | 'qualified' | 'converted';
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  gpt5Insights?: {
    bestApproach: string;
    conversationStarters: string[];
    mutualConnections: string[];
    predictedResponse: number;
  };
}

interface CircleNetwork {
  id: string;
  name: string;
  members: number;
  connections: number;
  engagement: number;
  growth: number;
  industries: string[];
}

interface ProspectingStats {
  totalProspects: number;
  activeCircles: number;
  conversionRate: number;
  engagementRate: number;
  monthlyGrowth: number;
  aiAccuracy: number;
}

export default function CircleProspectingDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('prospects');
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [conversationGoal, setConversationGoal] = useState('networking');
  const [targetIndustry, setTargetIndustry] = useState('technology');
  const [circleSize, setCircleSize] = useState('medium');
  const [prospectingMode, setProspectingMode] = useState('automated');
  const [engagementThreshold, setEngagementThreshold] = useState('medium');
  const [connectionLimits, setConnectionLimits] = useState('moderate');
  const [aiAnalysisFrequency, setAiAnalysisFrequency] = useState('daily');

  const { data: prospects = [], isLoading: prospectsLoading } = useQuery<Prospect[]>({
    queryKey: ['/api/prospects'],
    refetchInterval: 30000,
  });

  const { data: circles = [], isLoading: circlesLoading } = useQuery<CircleNetwork[]>({
    queryKey: ['/api/circles'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ProspectingStats>({
    queryKey: ['/api/prospecting/stats'],
    refetchInterval: 30000,
  });

  const analyzeProspect = async (prospect: Prospect) => {
    setIsAnalyzing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Prospect: ${prospect.name} at ${prospect.company}, Title: ${prospect.title}, Industry: ${prospect.industry}, Location: ${prospect.location}`,
        'prospect-analysis'
      );
      console.log('Prospect analysis:', result);
    } catch (error) {
      console.error('Failed to analyze prospect:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'engaged': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'qualified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'converted': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="create-circle"
      onClick={() => setShowCircleModal(true)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Circle
    </Button>,
    <Button
      key="ai-analysis"
      variant="outline"
      onClick={() => analyzeProspect(mockProspects[0])}
      disabled={isAnalyzing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isAnalyzing ? 'Analyzing...' : 'AI Prospect Analysis'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalProspects}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Prospects</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.activeCircles}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Circles</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{Math.round(stats.conversionRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.engagementRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</div>
      </div>
    </div>
  ) : null;

  const filteredProspects = prospects.filter(prospect => {
    if (searchQuery && !prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !prospect.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterIndustry !== 'all' && prospect.industry !== filterIndustry) return false;
    if (filterLocation !== 'all' && !prospect.location.includes(filterLocation)) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="Social Intelligence Network"
      appDescription="AI-powered social prospecting with intelligent circle building, engagement analysis, and automated outreach optimization"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="circles">Circles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-6">
          {/* Search and Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search prospects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="San Francisco">San Francisco</SelectItem>
                  <SelectItem value="Austin">Austin</SelectItem>
                  <SelectItem value="Seattle">Seattle</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Prospects List */}
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Prospects ({filteredProspects.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {filteredProspects.map(prospect => (
                  <GlassCard
                    key={prospect.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedProspect(prospect)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          prospect.status === 'engaged' ? 'bg-green-100' :
                          prospect.status === 'qualified' ? 'bg-purple-100' :
                          prospect.status === 'prospect' ? 'bg-blue-100' : 'bg-yellow-100'
                        }`}>
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{prospect.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{prospect.title} at {prospect.company}</div>
                          <div className="text-xs text-gray-500">{prospect.location} • {prospect.industry}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(prospect.status)}>
                          {prospect.status}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{prospect.connections} connections</div>
                          <div className="text-xs text-gray-500">{Math.round(prospect.engagement * 100)}% engaged</div>
                        </div>
                        {prospect.gpt5Insights && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-purple-600">AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="circles" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Circle Networks
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {circles.map(circle => (
                  <GlassCard key={circle.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{circle.name}</h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            {circle.members} members
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Connections:</span>
                            <span className="font-medium ml-1">{circle.connections}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Engagement:</span>
                            <span className="font-medium ml-1">{Math.round(circle.engagement * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Growth:</span>
                            <span className="font-medium ml-1 text-green-600">+{Math.round(circle.growth * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Industries:</span>
                            <span className="font-medium ml-1">{circle.industries.length}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {circle.industries.slice(0, 3).map(industry => (
                            <Badge key={industry} variant="outline" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Prospecting Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Prospect Growth</span>
                    <span className="font-semibold text-green-600">+{Math.round(stats.monthlyGrowth * 100)}%</span>
                  </div>
                  <Progress value={stats.monthlyGrowth * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Prediction Accuracy</span>
                    <span className="font-semibold">{Math.round(stats.aiAccuracy * 100)}%</span>
                  </div>
                  <Progress value={stats.aiAccuracy * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network Engagement Rate</span>
                    <span className="font-semibold">{Math.round(stats.engagementRate * 100)}%</span>
                  </div>
                  <Progress value={stats.engagementRate * 100} className="h-2" />
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prospects Identified</span>
                    <span className="font-semibold">2,150</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Initial Contact</span>
                    <span className="font-semibold">1,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engaged Conversations</span>
                    <span className="font-semibold">680</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualified Leads</span>
                    <span className="font-semibold">320</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversions</span>
                    <span className="font-semibold">180</span>
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
                  Conversation Starters
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prospect-profile">Prospect Profile</Label>
                    <Textarea
                      id="prospect-profile"
                      placeholder="Describe the prospect's background, interests, and company..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conversation-goal">Conversation Goal</Label>
                    <Select value={conversationGoal} onValueChange={setConversationGoal}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="sales">Sales Outreach</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Starters
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Circle Building
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="target-industry">Target Industry</Label>
                    <Select value={targetIndustry} onValueChange={setTargetIndustry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="circle-size">Target Circle Size</Label>
                    <Select value={circleSize} onValueChange={setCircleSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (50-100)</SelectItem>
                        <SelectItem value="medium">Medium (100-500)</SelectItem>
                        <SelectItem value="large">Large (500+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Network className="h-4 w-4 mr-2" />
                    Build Circle Strategy
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Circle Prospecting Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Prospecting Mode</Label>
                  <Select value={prospectingMode} onValueChange={setProspectingMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automated">AI Automated</SelectItem>
                      <SelectItem value="semi-automated">Semi-Automated</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Engagement Threshold</Label>
                  <Select value={engagementThreshold} onValueChange={setEngagementThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (30%)</SelectItem>
                      <SelectItem value="medium">Medium (50%)</SelectItem>
                      <SelectItem value="high">High (70%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Connection Limits</Label>
                  <Select value={connectionLimits} onValueChange={setConnectionLimits}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative (5/day)</SelectItem>
                      <SelectItem value="moderate">Moderate (10/day)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (20/day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Analysis Frequency</Label>
                  <Select value={aiAnalysisFrequency} onValueChange={setAiAnalysisFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Prospect Details Modal */}
      {selectedProspect && (
        <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Prospect Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</Label>
                  <div className="font-medium">{selectedProspect.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Company</Label>
                  <div className="font-medium">{selectedProspect.company}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</Label>
                  <div className="font-medium">{selectedProspect.title}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</Label>
                  <div className="font-medium">{selectedProspect.location}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Industry</Label>
                  <div className="font-medium">{selectedProspect.industry}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedProspect.status)}>
                    {selectedProspect.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Social Profiles</Label>
                <div className="flex gap-2">
                  {selectedProspect.socialProfiles.linkedin && (
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-1" />
                      LinkedIn
                    </Button>
                  )}
                  {selectedProspect.socialProfiles.twitter && (
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Twitter
                    </Button>
                  )}
                  {selectedProspect.socialProfiles.website && (
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </Button>
                  )}
                </div>
              </div>

              {selectedProspect.gpt5Insights && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Insights
                  </Label>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Best Approach:</strong> {selectedProspect.gpt5Insights.bestApproach}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conversation Starters:</div>
                      <ul className="space-y-1">
                        {selectedProspect.gpt5Insights.conversationStarters.map((starter, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {starter}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mutual Connections:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProspect.gpt5Insights.mutualConnections.map((connection, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {connection}
                          </Badge>
                        ))}
                      </div>
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