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
  Users,
  Target,
  Mail,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Play,
  Pause,
  Send,
  Eye,
  Plus,
  Calendar,
  Filter,
  Zap,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost';
  score: number;
  lastActivity: string;
  source: string;
  tags: string[];
  gpt5Insights?: {
    nextAction: string;
    priority: 'high' | 'medium' | 'low';
    predictedValue: number;
    engagement: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leads: number;
  conversionRate: number;
  budget: number;
  spent: number;
  channels: string[];
}

interface AutomationStats {
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  averageLeadScore: number;
  monthlyGrowth: number;
  aiAccuracy: number;
}

export default function LeadAutomationDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('leads');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [engagementLevel, setEngagementLevel] = useState('high');
  const [sequenceType, setSequenceType] = useState('nurture');
  const [scoringModel, setScoringModel] = useState('ai-powered');
  const [qualificationThreshold, setQualificationThreshold] = useState('70');
  const [emailAutomation, setEmailAutomation] = useState('enabled');
  const [leadAssignment, setLeadAssignment] = useState('round-robin');

  // Mock data
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@techcorp.com',
      company: 'TechCorp Inc',
      status: 'qualified',
      score: 85,
      lastActivity: '2024-01-15',
      source: 'Website',
      tags: ['Enterprise', 'High-Value'],
      gpt5Insights: {
        nextAction: 'Schedule product demo',
        priority: 'high',
        predictedValue: 50000,
        engagement: 0.9
      }
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@startup.io',
      company: 'Startup.io',
      status: 'nurturing',
      score: 65,
      lastActivity: '2024-01-12',
      source: 'LinkedIn',
      tags: ['Startup', 'Early-Stage'],
      gpt5Insights: {
        nextAction: 'Send educational content',
        priority: 'medium',
        predictedValue: 15000,
        engagement: 0.7
      }
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily@consulting.com',
      company: 'Davis Consulting',
      status: 'new',
      score: 45,
      lastActivity: '2024-01-10',
      source: 'Referral',
      tags: ['Consulting', 'Small Business']
    }
  ];

  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Enterprise Lead Nurture',
      status: 'active',
      leads: 150,
      conversionRate: 0.25,
      budget: 5000,
      spent: 3200,
      channels: ['Email', 'LinkedIn', 'Webinar']
    },
    {
      id: '2',
      name: 'SMB Awareness Campaign',
      status: 'active',
      leads: 300,
      conversionRate: 0.15,
      budget: 3000,
      spent: 1800,
      channels: ['Email', 'Social Media', 'Content']
    }
  ];

  const mockStats: AutomationStats = {
    totalLeads: 1250,
    activeCampaigns: 8,
    conversionRate: 0.22,
    averageLeadScore: 68,
    monthlyGrowth: 0.18,
    aiAccuracy: 0.89
  };

  const { data: leads = mockLeads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    refetchInterval: 30000,
  });

  const { data: campaigns = mockCampaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    refetchInterval: 30000,
  });

  const { data: stats = mockStats, isLoading: statsLoading } = useQuery<AutomationStats>({
    queryKey: ['/api/automation/stats'],
    refetchInterval: 30000,
  });

  const optimizeLeadStrategy = async (lead: Lead) => {
    setIsOptimizing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Lead: ${lead.name} from ${lead.company}, Score: ${lead.score}, Status: ${lead.status}, Tags: ${lead.tags.join(', ')}`,
        'lead-nurturing'
      );
      console.log('Lead optimization:', result);
    } catch (error) {
      console.error('Failed to optimize lead strategy:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'nurturing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'converted': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const actionButtons = [
    <Button
      key="create-campaign"
      onClick={() => setShowCampaignModal(true)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Campaign
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => optimizeLeadStrategy(mockLeads[0])}
      disabled={isOptimizing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Lead Insights'}
    </Button>
  ];

  const headerStats = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalLeads}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Leads</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{Math.round(stats.conversionRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.averageLeadScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Lead Score</div>
      </div>
    </div>
  );

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (filterSource !== 'all' && lead.source !== filterSource) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="AI Lead Nurturing Engine"
      appDescription="Intelligent lead scoring, automated nurturing campaigns, and AI-powered conversion optimization"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          {/* Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Leads List */}
          <GlassCard className="p-6">
            <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Pipeline ({filteredLeads.length})
              </h3>
            </div>
            <div className="px-0 pb-0">
              <div className="space-y-4">
                {filteredLeads.map(lead => (
                  <GlassCard
                    key={lead.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          lead.status === 'qualified' ? 'bg-green-100' :
                          lead.status === 'nurturing' ? 'bg-purple-100' :
                          lead.status === 'new' ? 'bg-blue-100' : 'bg-yellow-100'
                        }`}>
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold">{lead.score}/100</div>
                          <div className="text-sm text-gray-500">{lead.source}</div>
                        </div>
                        {lead.gpt5Insights && (
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
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <GlassCard className="p-6">
            <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Campaigns
              </h3>
            </div>
            <div className="px-0 pb-0">
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <GlassCard key={campaign.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Leads:</span>
                            <span className="font-medium ml-1">{campaign.leads}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Conversion:</span>
                            <span className="font-medium ml-1">{Math.round(campaign.conversionRate * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                            <span className="font-medium ml-1">${campaign.budget}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Spent:</span>
                            <span className="font-medium ml-1">${campaign.spent}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Budget Used</span>
                            <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                          </div>
                          <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
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
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Lead Performance
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lead Quality Score</span>
                    <span className="font-semibold">{stats.averageLeadScore}/100</span>
                  </div>
                  <Progress value={stats.averageLeadScore} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Prediction Accuracy</span>
                    <span className="font-semibold">{Math.round(stats.aiAccuracy * 100)}%</span>
                  </div>
                  <Progress value={stats.aiAccuracy * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Lead Growth</span>
                    <span className="font-semibold text-green-600">+{Math.round(stats.monthlyGrowth * 100)}%</span>
                  </div>
                  <Progress value={stats.monthlyGrowth * 100} className="h-2" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="px-0 pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion Funnel
                </h3>
              </div>
              <div className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Leads</span>
                    <span className="font-semibold">1,250</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contacted</span>
                    <span className="font-semibold">950</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualified</span>
                    <span className="font-semibold">425</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Converted</span>
                    <span className="font-semibold">275</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Lead Scoring Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lead-name">Lead Name</Label>
                    <Input
                      id="lead-name"
                      placeholder="Enter lead name"
                      defaultValue="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Enter company"
                      defaultValue="TechCorp Inc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="engagement">Engagement Level</Label>
                    <Select value={engagementLevel} onValueChange={setEngagementLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Calculate Lead Score
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automated Sequences
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sequence-type">Sequence Type</Label>
                    <Select value={sequenceType} onValueChange={setSequenceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nurture">Nurture Sequence</SelectItem>
                        <SelectItem value="followup">Follow-up Sequence</SelectItem>
                        <SelectItem value="reengagement">Re-engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sequence-name">Sequence Name</Label>
                    <Input
                      id="sequence-name"
                      placeholder="Enter sequence name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Textarea
                      id="target-audience"
                      placeholder="Describe target audience..."
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Create AI Sequence
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Lead Automation Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Lead Scoring Model</Label>
                  <Select value={scoringModel} onValueChange={setScoringModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-powered">AI-Powered</SelectItem>
                      <SelectItem value="rule-based">Rule-Based</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-qualification Threshold</Label>
                  <Select value={qualificationThreshold} onValueChange={setQualificationThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 points</SelectItem>
                      <SelectItem value="60">60 points</SelectItem>
                      <SelectItem value="70">70 points</SelectItem>
                      <SelectItem value="80">80 points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email Automation</Label>
                  <Select value={emailAutomation} onValueChange={setEmailAutomation}>
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
                  <Label>Lead Assignment</Label>
                  <Select value={leadAssignment} onValueChange={setLeadAssignment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="workload">Workload Based</SelectItem>
                      <SelectItem value="territory">Territory Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Lead Details Modal */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</Label>
                  <div className="font-medium">{selectedLead.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Company</Label>
                  <div className="font-medium">{selectedLead.company}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                  <div className="font-medium">{selectedLead.email}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Lead Score</Label>
                  <div className="font-medium">{selectedLead.score}/100</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedLead.status)}>
                    {selectedLead.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</Label>
                  <div className="font-medium">{selectedLead.source}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tags</Label>
                <div className="flex gap-2">
                  {selectedLead.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedLead.gpt5Insights && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Insights
                  </Label>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Next Action:</strong> {selectedLead.gpt5Insights.nextAction}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Priority:</strong>
                          <Badge className={`ml-2 ${getPriorityColor(selectedLead.gpt5Insights.priority)}`}>
                            {selectedLead.gpt5Insights.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <strong>Predicted Value:</strong> ${selectedLead.gpt5Insights.predictedValue.toLocaleString()}
                        </div>
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