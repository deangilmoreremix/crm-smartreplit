import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import CommunicationDashboard from '../components/CommunicationDashboard';
import GlassCard from '../components/GlassCard';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateAI } from '../services/aiGenerate';
import { useContactStore } from '../hooks/useContactStore';
import { useDealStore } from '../store/dealStore';
import CampaignDialog from '../components/leadAutomation/CampaignDialog';
import StepsEditor from '../components/leadAutomation/StepsEditor';
import {
  deleteCampaign,
  getCampaign,
  getSettings,
  listCampaigns,
  normalizeSteps,
  NeedsApiKeyError,
  processDueSteps,
  saveSettings,
  scoreContact,
  setCampaignStatus,
  STEP_SCHEMA,
  type CampaignDetails,
  type CampaignStep,
  type CampaignSummary,
  type LeadAutomationSettings,
  type ScoreResult,
} from '../services/leadAutomationApi';
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
  Clock,
  Trash2,
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
}

interface AutomationStats {
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  averageLeadScore: number;
  monthlyGrowth: number | null;
}

export default function LeadAutomationDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('leads');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState<{ name?: string; description?: string; steps?: CampaignStep[] } | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  // Campaigns
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails | null>(null);
  // Lead scoring
  const [scoreContactId, setScoreContactId] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  // Sequence generator
  const [sequenceType, setSequenceType] = useState('nurture');
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceAudience, setSequenceAudience] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState<CampaignStep[]>([]);
  const [generatingSequence, setGeneratingSequence] = useState(false);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  // Settings
  const [settings, setSettings] = useState<LeadAutomationSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  // Per-lead AI insights
  const [insights, setInsights] = useState<Record<string, { nextAction: string; priority: string }>>({});
  const [loadingInsightsFor, setLoadingInsightsFor] = useState<string | null>(null);

  // Leads are the CRM contacts; scores and activity come from the contact records
  const { contacts, fetchContacts } = useContactStore();
  const { deals } = useDealStore();
  const contactsArray = Object.values(contacts);
  const toLeadStatus = (status: string): Lead['status'] => {
    const value = String(status || '').toLowerCase();
    if (['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost'].includes(value)) return value as Lead['status'];
    if (value === 'customer') return 'converted';
    if (value === 'lead' || value === 'prospect') return 'new';
    if (value === 'churned' || value === 'inactive') return 'lost';
    return 'contacted';
  };
  const leads: Lead[] = contactsArray.map((c: any) => ({
    id: String(c.id),
    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    email: c.email || '',
    company: c.company || '',
    status: toLeadStatus(c.status),
    score: Math.round(c.aiScore ?? c.score ?? 0),
    lastActivity: new Date(c.lastContacted || c.updatedAt || c.createdAt).toISOString().slice(0, 10),
    source: c.source || (c.sources && c.sources[0]) || 'Unknown',
    tags: c.tags || [],
  }));

  const DAY = 86400000;
  const createdWithin = (c: any, from: number, to: number) => {
    const age = Date.now() - new Date(c.createdAt).getTime();
    return age < from * DAY && age >= to * DAY;
  };
  const newThis30 = contactsArray.filter((c) => createdWithin(c, 30, 0)).length;
  const newPrev30 = contactsArray.filter((c) => createdWithin(c, 60, 30)).length;
  const dealsArray = Object.values(deals);
  const wonDealCount = dealsArray.filter((d) => String(d.stage) === 'closed-won').length;
  const scoredLeads = leads.filter((l) => l.score > 0);
  const stats: AutomationStats = {
    totalLeads: leads.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    conversionRate: leads.length > 0 ? leads.filter((l) => l.status === 'converted').length / leads.length : 0,
    averageLeadScore: scoredLeads.length > 0 ? Math.round(scoredLeads.reduce((s, l) => s + l.score, 0) / scoredLeads.length) : 0,
    monthlyGrowth: newPrev30 > 0 ? (newThis30 - newPrev30) / newPrev30 : null,
  };

  const [leadStrategy, setLeadStrategy] = useState<string | null>(null);
  const optimizeLeadStrategy = async (lead: Lead) => {
    setIsOptimizing(true);
    setLeadStrategy(null);
    try {
      const result = await generateAI({
        prompt: `Suggest a nurturing strategy and next best action for this lead.\nName: ${lead.name}\nCompany: ${lead.company}\nScore: ${lead.score}\nStatus: ${lead.status}\nSource: ${lead.source}\nTags: ${lead.tags.join(', ')}\nWon deals in CRM overall: ${wonDealCount}`,
      });
      setLeadStrategy(`${lead.name}: ${result.content}`);
    } catch (error) {
      setLeadStrategy(error instanceof Error ? `AI strategy unavailable: ${error.message}` : 'AI strategy unavailable');
    } finally {
      setIsOptimizing(false);
    }
  };

  const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

  const loadCampaigns = async () => {
    try {
      setCampaigns(await listCampaigns());
      setCampaignsError(null);
    } catch (e) {
      setCampaignsError(errorText(e, 'Could not load campaigns'));
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    // The contact store is only filled by other pages, so load the contacts this page lists
    fetchContacts();
    // Create the tasks for any campaign steps that came due, then load campaigns and settings
    processDueSteps().catch(() => {}).finally(loadCampaigns);
    getSettings()
      .then(setSettings)
      .catch((e) => setSettingsError(errorText(e, 'Could not load settings')));
  }, []);

  const sourceOptions = Array.from(new Set(leads.map((l) => l.source))).sort();
  const funnel: Array<[string, Lead['status']]> = [
    ['New', 'new'],
    ['Contacted', 'contacted'],
    ['Qualified', 'qualified'],
    ['Nurturing', 'nurturing'],
    ['Converted', 'converted'],
    ['Lost', 'lost'],
  ];

  const runScore = async () => {
    if (!scoreContactId) return;
    setScoring(true);
    setScoreError(null);
    setScoreResult(null);
    try {
      setScoreResult(await scoreContact(scoreContactId));
      await fetchContacts();
    } catch (e) {
      setScoreError(errorText(e, 'Could not score this lead'));
    } finally {
      setScoring(false);
    }
  };

  const sequenceLabels: Record<string, string> = { nurture: 'nurture', followup: 'follow-up', reengagement: 're-engagement' };
  const generateSequence = async () => {
    if (!sequenceName.trim() && !sequenceAudience.trim()) {
      setSequenceError('Enter a sequence name or describe the target audience first.');
      return;
    }
    setGeneratingSequence(true);
    setSequenceError(null);
    try {
      const result = await generateAI({
        system: 'You design lead-nurturing sequences for a CRM. Each step becomes a task for a salesperson, so write the exact message to send.',
        prompt: `Create a 4-6 step ${sequenceLabels[sequenceType] || 'nurture'} sequence.\nName: ${sequenceName || 'Untitled'}\nTarget audience: ${sequenceAudience || 'Not specified'}\nUse a mix of channels and spread the steps over about 2 weeks.`,
        schema: STEP_SCHEMA as unknown as Record<string, unknown>,
        schemaName: 'sequence_steps',
      });
      const steps = normalizeSteps(result.data?.steps);
      if (!steps.length) throw new Error('The AI did not return any steps. Try again.');
      setSequenceSteps(steps);
    } catch (e) {
      setSequenceError(errorText(e, 'Could not generate the sequence'));
    } finally {
      setGeneratingSequence(false);
    }
  };

  const saveSequenceAsCampaign = () => {
    setCampaignDraft({ name: sequenceName, description: sequenceAudience, steps: sequenceSteps });
    setShowCampaignModal(true);
  };

  const toggleCampaign = async (campaign: CampaignSummary) => {
    try {
      await setCampaignStatus(campaign.id, campaign.status === 'active' ? 'paused' : 'active');
      await loadCampaigns();
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not update the campaign') });
    }
  };

  const removeCampaign = async (campaign: CampaignSummary) => {
    if (!window.confirm(`Delete "${campaign.name}"? Tasks already created are kept.`)) return;
    try {
      await deleteCampaign(campaign.id);
      await loadCampaigns();
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not delete the campaign') });
    }
  };

  const openCampaign = async (campaign: CampaignSummary) => {
    try {
      setCampaignDetails(await getCampaign(campaign.id));
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not load the campaign') });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      setSettings(await saveSettings(settings));
      setNotice({ kind: 'success', text: 'Settings saved.' });
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not save settings') });
    } finally {
      setSavingSettings(false);
    }
  };

  const getLeadInsights = async (lead: Lead) => {
    setLoadingInsightsFor(lead.id);
    try {
      const result = await generateAI({
        system: 'You are a sales coach. Use only the facts given.',
        prompt: `What is the next best action for this lead, and how urgent is it?\nName: ${lead.name}\nCompany: ${lead.company}\nScore: ${lead.score}\nStatus: ${lead.status}\nSource: ${lead.source}\nTags: ${lead.tags.join(', ')}`,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['nextAction', 'priority'],
          properties: { nextAction: { type: 'string' }, priority: { type: 'string', enum: ['high', 'medium', 'low'] } },
        },
        schemaName: 'lead_insights',
      });
      if (!result.data?.nextAction) throw new Error('The AI response was incomplete.');
      setInsights((prev) => ({ ...prev, [lead.id]: { nextAction: result.data.nextAction, priority: result.data.priority } }));
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not get AI insights') });
    } finally {
      setLoadingInsightsFor(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'qualified':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'nurturing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
      case 'lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const actionButtons = [
    <Button
      key="create-campaign"
      onClick={() => {
        setCampaignDraft(undefined);
        setShowCampaignModal(true);
      }}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Campaign
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => {
        const target = [...leads].sort((a, b) => b.score - a.score)[0];
        if (target) optimizeLeadStrategy(target);
      }}
      disabled={isOptimizing || leads.length === 0}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Lead Insights'}
    </Button>,
  ];

  const headerStats = (
    <div>
    {notice && (
      <div
        role="status"
        className={`mt-4 p-3 rounded-lg text-sm ${notice.kind === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
      >
        {notice.text}
      </div>
    )}
    {leadStrategy && (
      <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm whitespace-pre-wrap">{leadStrategy}</div>
    )}
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
        <div className="text-2xl font-bold text-purple-600">
          {Math.round(stats.conversionRate * 100)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.averageLeadScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Lead Score</div>
      </div>
    </div>
    </div>
  );

  const filteredLeads = leads.filter((lead) => {
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
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
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
                {filteredLeads.length === 0 && <p className="text-sm text-gray-500">No contacts match. Add contacts to see them here.</p>}
                {filteredLeads.map((lead) => (
                  <GlassCard
                    key={lead.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            lead.status === 'qualified'
                              ? 'bg-green-100'
                              : lead.status === 'nurturing'
                                ? 'bg-purple-100'
                                : lead.status === 'new'
                                  ? 'bg-blue-100'
                                  : 'bg-yellow-100'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {lead.company}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        <div className="text-right">
                          <div className="font-semibold">{lead.score}/100</div>
                          <div className="text-sm text-gray-500">{lead.source}</div>
                        </div>
                        {insights[lead.id] && (
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
                Campaigns
              </h3>
            </div>
            <div className="px-0 pb-0">
              <div className="space-y-4">
                {campaignsLoading && <p className="text-sm text-gray-500">Loading campaigns...</p>}
                {campaignsError && <p className="text-sm text-red-600">{campaignsError}</p>}
                {!campaignsLoading && !campaignsError && campaigns.length === 0 && (
                  <p className="text-sm text-gray-500">No campaigns yet. Use Create Campaign to start one.</p>
                )}
                {campaigns.map((campaign) => (
                  <GlassCard key={campaign.id} className="p-4">
                    <div className="flex items-center justify-between" data-testid="campaign-card">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <Badge
                            className={
                              campaign.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : campaign.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        {campaign.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{campaign.description}</p>}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Leads:</span>
                            <span className="font-medium ml-1">{campaign.leads}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Conversion:</span>
                            <span className="font-medium ml-1">
                              {campaign.conversionRate === null ? '—' : `${Math.round(campaign.conversionRate * 100)}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Steps:</span>
                            <span className="font-medium ml-1">{campaign.steps.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => openCampaign(campaign)} aria-label={`View ${campaign.name}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status !== 'completed' && (
                          <Button variant="outline" size="sm" onClick={() => toggleCampaign(campaign)} aria-label={campaign.status === 'active' ? `Pause ${campaign.name}` : `Resume ${campaign.name}`}>
                            {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => removeCampaign(campaign)} aria-label={`Delete ${campaign.name}`}>
                          <Trash2 className="h-4 w-4" />
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
                    <span className="text-sm">Monthly Lead Growth</span>
                    <span className="font-semibold text-green-600">
                      {stats.monthlyGrowth === null
                        ? 'No contacts added last month'
                        : `${stats.monthlyGrowth >= 0 ? '+' : ''}${Math.round(stats.monthlyGrowth * 100)}%`}
                    </span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, (stats.monthlyGrowth ?? 0) * 100))} className="h-2" />
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
                  {funnel.map(([label, status]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{label}</span>
                      <span className="font-semibold">{leads.filter((l) => l.status === status).length}</span>
                    </div>
                  ))}
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
                    <Label htmlFor="score-contact">Contact</Label>
                    <Select value={scoreContactId} onValueChange={setScoreContactId}>
                      <SelectTrigger id="score-contact" aria-label="Contact to score">
                        <SelectValue placeholder={leads.length ? 'Choose a contact' : 'No contacts yet'}>
                          {(() => {
                            const chosen = leads.find((l) => l.id === scoreContactId);
                            return chosen ? `${chosen.name || chosen.email}${chosen.company ? ` — ${chosen.company}` : ''}` : undefined;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name || lead.email}
                            {lead.company ? ` — ${lead.company}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {settings && (
                    <p className="text-xs text-gray-500">
                      Model: {settings.scoringModel}. A score of {settings.qualificationThreshold}+ marks the contact as qualified (change in Settings).
                    </p>
                  )}
                  <Button className="w-full" onClick={runScore} disabled={!scoreContactId || scoring}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {scoring ? 'Scoring...' : 'Calculate Lead Score'}
                  </Button>
                  {scoreError && <p className="text-sm text-red-600" role="alert">{scoreError}</p>}
                  {scoreResult && (
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm space-y-1" data-testid="score-result">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{scoreResult.score}/100</span>
                        <Badge className={getPriorityColor(scoreResult.priority === 'hot' ? 'high' : scoreResult.priority === 'warm' ? 'medium' : 'low')}>{scoreResult.priority}</Badge>
                        {scoreResult.qualified && <Badge className="bg-green-100 text-green-800">marked qualified</Badge>}
                      </div>
                      <p className="whitespace-pre-wrap">{scoreResult.rationale}</p>
                      <p className="text-xs text-gray-500">Method: {scoreResult.method}. The score was saved to the contact.</p>
                    </div>
                  )}
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
                      <SelectTrigger id="sequence-type">
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
                    <Input id="sequence-name" placeholder="Enter sequence name" value={sequenceName} onChange={(e) => setSequenceName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Textarea
                      id="target-audience"
                      placeholder="Describe target audience..."
                      rows={3}
                      value={sequenceAudience}
                      onChange={(e) => setSequenceAudience(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" variant="outline" onClick={generateSequence} disabled={generatingSequence}>
                    <Play className="h-4 w-4 mr-2" />
                    {generatingSequence ? 'Generating...' : 'Create AI Sequence'}
                  </Button>
                  {sequenceError && <p className="text-sm text-red-600" role="alert">{sequenceError}</p>}
                  {sequenceSteps.length > 0 && (
                    <div className="space-y-3" data-testid="sequence-preview">
                      <p className="text-sm font-medium">Generated steps (edit as needed)</p>
                      <StepsEditor steps={sequenceSteps} onChange={setSequenceSteps} />
                      <Button className="w-full" onClick={saveSequenceAsCampaign}>
                        Save as campaign
                      </Button>
                    </div>
                  )}
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
              {settingsError && <p className="text-sm text-red-600 mb-4">{settingsError}</p>}
              {!settings && !settingsError && <p className="text-sm text-gray-500">Loading settings...</p>}
              {settings && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="scoring-model">Lead Scoring Model</Label>
                      <Select value={settings.scoringModel} onValueChange={(v) => setSettings({ ...settings, scoringModel: v as LeadAutomationSettings['scoringModel'] })}>
                        <SelectTrigger id="scoring-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai-powered">AI-Powered</SelectItem>
                          <SelectItem value="rule-based">Rule-Based</SelectItem>
                          <SelectItem value="hybrid">Hybrid (average of both)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Rule-based scoring uses the contact record only and needs no OpenAI key.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification-threshold">Auto-qualification Threshold (0-100)</Label>
                      <Input
                        id="qualification-threshold"
                        type="number"
                        min={0}
                        max={100}
                        value={settings.qualificationThreshold}
                        onChange={(e) => setSettings({ ...settings, qualificationThreshold: Number(e.target.value) })}
                      />
                      <p className="text-xs text-gray-500">When a lead scores at or above this, its status is set to qualified.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="followup-tasks">Create follow-up tasks automatically</Label>
                      <Select value={settings.createFollowupTasks ? 'enabled' : 'disabled'} onValueChange={(v) => setSettings({ ...settings, createFollowupTasks: v === 'enabled' })}>
                        <SelectTrigger id="followup-tasks">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">When on, each campaign step becomes a task on its day. Nothing is sent to contacts automatically.</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? 'Saving...' : 'Save settings'}
                  </Button>
                </div>
              )}
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
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Name
                  </Label>
                  <div className="font-medium">{selectedLead.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Company
                  </Label>
                  <div className="font-medium">{selectedLead.company}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </Label>
                  <div className="font-medium">{selectedLead.email}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Lead Score
                  </Label>
                  <div className="font-medium">{selectedLead.score}/100</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </Label>
                  <Badge className={getStatusColor(selectedLead.status)}>
                    {selectedLead.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Source
                  </Label>
                  <div className="font-medium">{selectedLead.source}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Tags
                </Label>
                <div className="flex gap-2">
                  {selectedLead.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Insights
                </Label>
                {insights[selectedLead.id] ? (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-200 space-y-2">
                    <div>
                      <strong>Next Action:</strong> {insights[selectedLead.id].nextAction}
                    </div>
                    <div>
                      <strong>Priority:</strong>
                      <Badge className={`ml-2 ${getPriorityColor(insights[selectedLead.id].priority)}`}>{insights[selectedLead.id].priority}</Badge>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => getLeadInsights(selectedLead)} disabled={loadingInsightsFor === selectedLead.id}>
                    {loadingInsightsFor === selectedLead.id ? 'Analyzing...' : 'Get AI insights'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CampaignDialog
        open={showCampaignModal}
        onOpenChange={setShowCampaignModal}
        contacts={contactsArray as any[]}
        initial={campaignDraft}
        onCreated={async ({ name, enrolled, tasksCreated }) => {
          setNotice({ kind: 'success', text: `Campaign "${name}" created: ${enrolled} contact(s) enrolled, ${tasksCreated} task(s) created.` });
          setActiveTab('campaigns');
          await loadCampaigns();
        }}
      />

      {campaignDetails && (
        <Dialog open onOpenChange={() => setCampaignDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{campaignDetails.campaign.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div>
                <div className="font-medium mb-1">Steps</div>
                <ol className="list-decimal ml-5 space-y-2">
                  {campaignDetails.campaign.steps.map((step, i) => (
                    <li key={i}>
                      <span className="font-medium">Day {step.day} · {step.channel} · {step.title}</span>
                      {step.message && <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{step.message}</div>}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="font-medium mb-1">Contacts ({campaignDetails.enrollments.length})</div>
                {campaignDetails.enrollments.length === 0 && <p className="text-gray-500">No contacts matched this audience.</p>}
                <ul className="space-y-1">
                  {campaignDetails.enrollments.map((e) => (
                    <li key={e.id} className="flex justify-between">
                      <span>{`${e.firstName} ${e.lastName}`.trim()}</span>
                      <span className="text-gray-500">
                        {e.status === 'done' ? 'finished' : `step ${e.nextStep + 1} due ${e.nextDueAt ? new Date(e.nextDueAt).toLocaleDateString() : '—'}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}
