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

interface ContactIntelligence {
  contactId: string;
  enrichmentScore: number;
  leadScore: number;
  engagementLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  recommendations: string[];
  predictedValue: number;
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

const ContactAnalyticsDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  const { deals } = useDealStore();

  const [contactIntelligence, setContactIntelligence] = useState<ContactIntelligence[]>([]);
  const [analytics, setAnalytics] = useState<ContactAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

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

    // Calculate lead score distribution
    const leadScoreDistribution = [
      { range: '0-20', count: Math.floor(totalContacts * 0.15) },
      { range: '21-40', count: Math.floor(totalContacts * 0.25) },
      { range: '41-60', count: Math.floor(totalContacts * 0.3) },
      { range: '61-80', count: Math.floor(totalContacts * 0.2) },
      { range: '81-100', count: Math.floor(totalContacts * 0.1) },
    ];

    // Calculate conversion rates
    const conversionRates = [
      { stage: 'Contact', rate: 100 },
      { stage: 'Lead', rate: 75 },
      { stage: 'Qualified', rate: 45 },
      { stage: 'Proposal', rate: 25 },
      { stage: 'Closed', rate: 12 },
    ];

    setAnalytics({
      totalContacts,
      activeContacts,
      newContactsThisMonth,
      avgEngagementScore: 72, // Mock data
      topIndustries,
      leadScoreDistribution,
      conversionRates,
    });
  }, [contacts, deals]);

  // Generate AI-powered contact intelligence
  const analyzeContacts = async () => {
    setIsAnalyzing(true);
    try {
      const contactsArray = Object.values(contacts);
      const intelligence: ContactIntelligence[] = [];

      for (const contact of contactsArray.slice(0, 8)) {
        // Analyze first 8 contacts for demo
        // Generate mock AI intelligence (in real implementation, this would call AI services)
        intelligence.push({
          contactId: contact.id,
          enrichmentScore: Math.floor(Math.random() * 40) + 60, // 60-100
          leadScore: Math.floor(Math.random() * 100), // 0-100
          engagementLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          riskFactors: [
            'Low engagement',
            'Competitor mentioned',
            'Budget constraints',
            'Long sales cycle',
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          recommendations: [
            'Schedule follow-up call',
            'Send personalized email',
            'Share case study',
            'Offer product demo',
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          predictedValue: Math.floor(Math.random() * 50000) + 10000, // $10k-$60k
          lastActivity: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          socialProfiles: [
            {
              platform: 'LinkedIn',
              url: `https://linkedin.com/in/${contact.name.toLowerCase().replace(' ', '')}`,
              verified: Math.random() > 0.3,
            },
            {
              platform: 'Twitter',
              url: `https://twitter.com/${contact.name.toLowerCase().replace(' ', '')}`,
              verified: Math.random() > 0.5,
            },
          ].filter(() => Math.random() > 0.5),
        });
      }

      setContactIntelligence(intelligence);
    } catch (error) {
      console.error('Failed to analyze contacts:', error);
    } finally {
      setIsAnalyzing(false);
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

  const engagementData = [
    { level: 'High', count: Math.floor((analytics?.totalContacts || 0) * 0.3), color: '#10b981' },
    { level: 'Medium', count: Math.floor((analytics?.totalContacts || 0) * 0.5), color: '#f59e0b' },
    { level: 'Low', count: Math.floor((analytics?.totalContacts || 0) * 0.2), color: '#ef4444' },
  ];

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
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Contacts'}</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
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
                            Predicted Value
                          </p>
                          <p className="text-lg font-semibold">
                            ${intelligence.predictedValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enrichment Score
                          </p>
                          <p className="text-lg font-semibold">{intelligence.enrichmentScore}%</p>
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
