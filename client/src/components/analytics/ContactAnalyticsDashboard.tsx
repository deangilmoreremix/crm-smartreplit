import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  TrendingUp,
  Search,
  Brain,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Target,
  Filter,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useContactStore } from '@/hooks/useContactStore';
import { useDealStore } from '../../store/dealStore';
import { aiIntelligenceEngine } from '../../services/ai-intelligence-engine.service';
import { scoreContact, NeedsApiKeyError, type ScoreResult } from '../../services/leadAutomationApi';

interface ContactIntelligence {
  contactId: string;
  leadScore: number;
  priority: ScoreResult['priority'];
  rationale: string;
  engagementLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  recommendations: string[];
  lastActivity: string;
  socialProfiles: Array<{
    platform: string;
    url: string;
    verified: boolean;
  }>;
}

interface ContactAnalytics {
  totalContacts: number;
  activeContacts: number;
  newContactsThisMonth: number;
  avgEngagementScore: number;
  topIndustries: Array<{ name: string; count: number }>;
  leadScoreDistribution: Array<{ range: string; count: number }>;
  conversionRates: Array<{ stage: string; rate: number }>;
}

const SCORE_CONCURRENCY = 3;

type EngagementLevel = ContactIntelligence['engagementLevel'];

// Engagement level from how recently the contact was touched (last contact, else last update)
const getEngagementLevel = (contact: { lastContact?: any; updatedAt?: any }): EngagementLevel => {
  const last = contact.lastContact || contact.updatedAt;
  const days = last ? (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24) : Infinity;
  return days < 7 ? 'high' : days < 30 ? 'medium' : 'low';
};

const ContactAnalyticsDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts, fetchContacts } = useContactStore();
  const { deals } = useDealStore();

  const [contactIntelligence, setContactIntelligence] = useState<ContactIntelligence[]>([]);
  const [analytics, setAnalytics] = useState<ContactAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [analyzeErrors, setAnalyzeErrors] = useState<string[]>([]);

  // Calculate contact analytics
  useEffect(() => {
    const contactsArray = Object.values(contacts);
    const dealsArray = Object.values(deals);

    // Calculate basic metrics
    const totalContacts = contactsArray.length;
    const activeContacts = contactsArray.filter(
      (c) =>
        c.lastActivity && new Date(c.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const newContactsThisMonth = contactsArray.filter(
      (c) => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    // Calculate industry distribution
    const industryCount: Record<string, number> = {};
    contactsArray.forEach((contact) => {
      const industry = contact.industry || 'Unknown';
      industryCount[industry] = (industryCount[industry] || 0) + 1;
    });

    const topIndustries = Object.entries(industryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate lead score distribution from actual contact scores
    // Scores are 0-100 (the store maps the saved 0-1 score to aiScore; older records may only have score)
    const scores = contactsArray
      .map((c: any) => (typeof c.aiScore === 'number' ? c.aiScore : typeof c.score === 'number' ? c.score : null))
      .filter((n): n is number => n !== null);
    const between = (lo: number, hi: number) => scores.filter((n) => n > lo && n <= hi).length;
    const leadScoreDistribution = [
      { range: '0-20', count: scores.filter((n) => n <= 20).length },
      { range: '21-40', count: between(20, 40) },
      { range: '41-60', count: between(40, 60) },
      { range: '61-80', count: between(60, 80) },
      { range: '81-100', count: scores.filter((n) => n > 80).length },
    ];

    // Calculate conversion rates from deals data
    const dealsByStage = dealsArray.reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalDeals = dealsArray.length || 1;
    const conversionRates = [
      { stage: 'Contact', rate: 100 },
      { stage: 'Lead', rate: dealsByStage['lead'] ? Math.round((dealsByStage['lead'] / totalDeals) * 100) : 0 },
      { stage: 'Qualified', rate: dealsByStage['qualified'] ? Math.round((dealsByStage['qualified'] / totalDeals) * 100) : 0 },
      { stage: 'Proposal', rate: dealsByStage['proposal'] ? Math.round((dealsByStage['proposal'] / totalDeals) * 100) : 0 },
      { stage: 'Closed', rate: dealsByStage['closed_won'] ? Math.round((dealsByStage['closed_won'] / totalDeals) * 100) : 0 },
    ];

    // Calculate average engagement score from actual contact data
    const engagementScores = contactsArray.map((c) => {
      const score = c.score || c.aiScore || 0;
      const lastActivity = c.lastContact ? new Date(c.lastContact).getTime() : (c.updatedAt ? new Date(c.updatedAt).getTime() : 0);
      const recencyBonus = lastActivity > 0 ? Math.max(0, 10 - (Date.now() - lastActivity) / (1000 * 60 * 60 * 24 * 30)) : 0;
      return Math.min(100, score * 100 + recencyBonus);
    });
    const avgEngagementScore = engagementScores.length > 0
      ? Math.round(engagementScores.reduce((sum, s) => sum + s, 0) / engagementScores.length)
      : 0;

    setAnalytics({
      totalContacts,
      activeContacts,
      newContactsThisMonth,
      avgEngagementScore,
      topIndustries,
      leadScoreDistribution,
      conversionRates,
    });
  }, [contacts, deals]);

  // Score every contact with the server's lead scoring (saves the score), then refresh the store
  const analyzeContacts = async () => {
    const contactsArray = Object.values(contacts);
    if (contactsArray.length === 0) {
      setAnalyzeErrors(['There are no contacts to analyze.']);
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeErrors([]);
    setProgress({ done: 0, total: contactsArray.length });
    const intelligence: ContactIntelligence[] = [];
    const errors: string[] = [];
    let next = 0;
    let done = 0;
    let stop = false;

    const worker = async () => {
      while (!stop && next < contactsArray.length) {
        const contact = contactsArray[next++];
        try {
          const result = await scoreContact(contact.id);
          const lastActivityDate = contact.lastContact ? new Date(contact.lastContact) : new Date(contact.updatedAt);
          const daysSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
          const hasNotes = contact.notes && contact.notes.length > 0;
          const hasEmail = !!contact.email;
          const hasPhone = !!contact.phone;
          intelligence.push({
            contactId: contact.id,
            leadScore: result.score,
            priority: result.priority,
            rationale: result.rationale,
            engagementLevel: getEngagementLevel(contact),
            riskFactors: [
              ...(!hasEmail ? ['Missing email'] : []),
              ...(!hasPhone ? ['Missing phone'] : []),
              ...(!hasNotes ? ['No interaction notes'] : []),
              ...(daysSinceActivity > 30 ? ['Long inactivity period'] : []),
            ].slice(0, 3),
            recommendations: [
              ...(!hasEmail ? ['Collect email address'] : []),
              ...(!hasPhone ? ['Collect phone number'] : []),
              ...(daysSinceActivity > 14 ? ['Schedule follow-up'] : []),
            ].slice(0, 3),
            lastActivity: lastActivityDate.toISOString(),
            socialProfiles: Object.entries(contact.socialProfiles || {}).map(([platform, url]) => ({
              platform: platform.charAt(0).toUpperCase() + platform.slice(1),
              url: url as string,
              verified: !!url,
            })),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Scoring failed';
          errors.push(`${contact.name || contact.email || contact.id}: ${message}`);
          // A missing API key fails every contact the same way; stop instead of repeating it
          if (error instanceof NeedsApiKeyError) stop = true;
        } finally {
          done += 1;
          setProgress({ done, total: contactsArray.length });
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: SCORE_CONCURRENCY }, worker));
      setContactIntelligence(intelligence);
      setAnalyzeErrors(errors);
      if (intelligence.length > 0) await fetchContacts();
    } catch (error) {
      setAnalyzeErrors([error instanceof Error ? error.message : 'Analysis failed']);
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contactIntelligence.filter((contact) => {
    if (!searchTerm) return true;
    const contactData = contacts[contact.contactId];
    return (
      contactData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactData?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Prepare chart data
  const industryChartData =
    analytics?.topIndustries.map((industry) => ({
      name: industry.name.length > 15 ? industry.name.substring(0, 15) + '...' : industry.name,
      value: industry.count,
    })) || [];

  const leadScoreChartData = analytics?.leadScoreDistribution || [];

  const conversionChartData = analytics?.conversionRates || [];

  const engagementData = (['high', 'medium', 'low'] as const).map((level) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    count: Object.values(contacts).filter((c) => getEngagementLevel(c) === level).length,
    color: level === 'high' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444',
  }));

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered contact intelligence and lead scoring
          </p>
        </div>
        <Button
          onClick={analyzeContacts}
          disabled={isAnalyzing}
          className="flex items-center space-x-2"
        >
          <Brain className="w-4 h-4" />
          <span>
            {isAnalyzing
              ? `Scoring ${progress?.done ?? 0}/${progress?.total ?? 0}...`
              : 'Analyze Contacts'}
          </span>
        </Button>
      </div>

      {analyzeErrors.length > 0 && (
        <div role="alert" className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {analyzeErrors.slice(0, 5).map((message, i) => (
            <p key={i}>{message}</p>
          ))}
          {analyzeErrors.length > 5 && <p>and {analyzeErrors.length - 5} more</p>}
        </div>
      )}

      <Tabs value="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Contact Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalContacts || 0}</div>
                <p className="text-xs text-muted-foreground">In your database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeContacts || 0}</div>
                <p className="text-xs text-muted-foreground">Active in last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.newContactsThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">Added recently</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avgEngagementScore || 0}%</div>
                <p className="text-xs text-muted-foreground">Engagement score</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Industries</CardTitle>
                <CardDescription>Contact distribution by industry</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={industryChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Score Distribution</CardTitle>
                <CardDescription>How contacts are distributed across lead scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadScoreChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Levels</CardTitle>
              <CardDescription>Contacts by recency of last contact (high under 7 days, medium under 30)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6" data-testid="engagement-levels">
                {engagementData.map((entry) => (
                  <div key={entry.level} className="text-center">
                    <div className="text-2xl font-bold" style={{ color: entry.color }}>{entry.count}</div>
                    <p className="text-xs text-muted-foreground">{entry.level}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Contact to Customer Conversion</CardTitle>
              <CardDescription>Conversion rates through the sales funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={conversionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                  <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>

          {contactIntelligence.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Intelligence Data</h4>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Click "Analyze Contacts" to generate AI-powered insights for your contact database
                </p>
                <Button onClick={analyzeContacts} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Contacts'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((intelligence) => {
                const contact = contacts[intelligence.contactId];
                if (!contact) return null;

                return (
                  <Card key={intelligence.contactId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {contact.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {contact.name}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">{contact.email}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {contact.company}
                            </p>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(intelligence.engagementLevel)}`}
                          >
                            {intelligence.engagementLevel.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Score:{' '}
                            <span
                              className={`font-semibold ${getScoreColor(intelligence.leadScore)}`}
                            >
                              {intelligence.leadScore}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Priority
                          </p>
                          <p className="text-lg font-semibold capitalize">{intelligence.priority}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Why this score
                          </p>
                          <p className="text-sm">{intelligence.rationale}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Activity</p>
                          <p className="text-sm font-semibold">
                            {new Date(intelligence.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {intelligence.socialProfiles.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Social Profiles</p>
                          <div className="flex flex-wrap gap-2">
                            {intelligence.socialProfiles.map((profile, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="flex items-center space-x-1"
                              >
                                <span>{profile.platform}</span>
                                {profile.verified && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {intelligence.riskFactors.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                            Risk Factors
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {intelligence.riskFactors.map((factor, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {intelligence.recommendations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">
                            Recommendations
                          </p>
                          <ul className="space-y-1">
                            {intelligence.recommendations.map((rec, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                              >
                                <span className="text-green-600 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContact(intelligence.contactId)}
                        >
                          View Details
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <Phone className="w-4 h-4 text-gray-400" />
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Engine</CardTitle>
              <CardDescription>Advanced lead scoring with multi-factor analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Advanced Scoring</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Multi-factor lead scoring with engagement patterns and predictive analytics
                </p>
                <Badge variant="secondary">AI-Powered</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Insights & Recommendations</CardTitle>
              <CardDescription>
                AI-generated insights and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Smart Insights</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  AI-powered insights and personalized recommendations for each contact
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactAnalyticsDashboard;
