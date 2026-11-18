import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import Avatar from '../components/ui/Avatar';
import { researchAI, type UrlSource } from '../services/aiGenerate';
import { SourcesList } from '../components/ai/SourcesList';
import {
  Shield,
  TrendingUp,
  Target,
  Eye,
  AlertTriangle,
  BarChart3,
  Users,
  Globe,
  Search,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';

const CompetitorInsights: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Competitor research (web search with sources; user's OpenAI key)
  interface CompetitorProfile {
    name: string;
    marketPosition: string;
    pricing: string;
    strengths: string[];
    weaknesses: string[];
    threat: 'High' | 'Medium' | 'Low';
  }
  const [competitorNames, setCompetitorNames] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [strategies, setStrategies] = useState<Array<{ strategy: string; rationale: string }>>([]);
  const [sources, setSources] = useState<UrlSource[]>([]);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // Competitive metrics from CRM deals
  const dealsArray = Object.values(deals);
  // Deals marked as competitive: customFields.competitor set, or tagged competitor/competitive
  const dealCompetitor = (d: any): string | null =>
    (d.customFields && (d.customFields.competitor || d.customFields.competitors)) ||
    ((d.tags || []).some((t: string) => /competit/i.test(t)) ? 'Competitor' : null);
  const competitiveDeals = dealsArray.filter(
    (d) => dealCompetitor(d) && !['closed-won', 'closed-lost'].includes(String(d.stage))
  );
  const wonCount = dealsArray.filter((d) => String(d.stage) === 'closed-won').length;
  const lostDeals = dealsArray.filter((d) => String(d.stage) === 'closed-lost');
  const closedCount = wonCount + lostDeals.length;
  const ourWinRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : null;
  const highThreatDeals = competitiveDeals.filter((d) => d.probability < 40).length;
  const lossReasons = Object.entries(
    lostDeals.reduce<Record<string, number>>((acc, d) => {
      const reason = (d.lostReason || '').trim() || 'No reason recorded';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([reason, count]) => ({ reason, count, percentage: Math.round((count / lostDeals.length) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const topContacts = Object.values(contacts).slice(0, 6);

  const researchCompetitors = async () => {
    const names = competitorNames
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setResearchError('Enter at least one competitor name.');
      return;
    }
    setResearching(true);
    setResearchError(null);
    try {
      const result = await researchAI({
        prompt: `Research these competitors using current web sources: ${names.join(', ')}. For each, describe market position, pricing, strengths, weaknesses and how much of a threat they are to a CRM/sales software vendor. Then suggest competitive strategies.`,
        schemaName: 'competitor_research',
        schema: {
          type: 'object',
          properties: {
            competitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  marketPosition: { type: 'string' },
                  pricing: { type: 'string' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                  threat: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                },
                required: ['name', 'marketPosition', 'pricing', 'strengths', 'weaknesses', 'threat'],
                additionalProperties: false,
              },
            },
            strategies: {
              type: 'array',
              items: {
                type: 'object',
                properties: { strategy: { type: 'string' }, rationale: { type: 'string' } },
                required: ['strategy', 'rationale'],
                additionalProperties: false,
              },
            },
          },
          required: ['competitors', 'strategies'],
          additionalProperties: false,
        },
      });
      setCompetitors(result.data?.competitors || []);
      setStrategies(result.data?.strategies || []);
      setSources(result.sources);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Competitor research is unavailable');
    } finally {
      setResearching(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get contact info from contactId
  const getContactInfo = (contactId: number | string | null) => {
    if (!contactId) return { name: 'Unknown Contact', initials: 'UC' };
    const contact = contacts[contactId];
    if (!contact) return { name: 'Unknown Contact', initials: 'UC' };
    return {
      name: contact.name,
      initials: contact.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase(),
    };
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <PageLayout
      title="Competitor Insights"
      description="Market intelligence and competitive analysis for strategic advantage"
    >
      <div className="space-y-8">
        {/* Competitive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{closedCount} closed</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {ourWinRate !== null ? `${ourWinRate}%` : '—'}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Our Win Rate
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {competitiveDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Competitive Deals
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Researched</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {competitors.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Competitors Profiled
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <Zap className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Alert</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{highThreatDeals}</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Competitive Deals Under 40%
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Competitor Landscape */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
            >
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Competitive Landscape Analysis
            </h2>
            <ModernButton variant="glass" size="sm" onClick={researchCompetitors} disabled={researching}>
              <Search className="h-4 w-4 mr-2" />
              {researching ? 'Researching…' : 'Research'}
            </ModernButton>
          </div>

          <input
            type="text"
            value={competitorNames}
            onChange={(e) => setCompetitorNames(e.target.value)}
            placeholder="Competitor names, comma separated (e.g. Salesforce, HubSpot)"
            className={`w-full mb-4 px-3 py-2 rounded-lg border text-sm ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          />
          {researchError && <p className="text-sm text-red-500 mb-4">{researchError}</p>}
          {competitors.length === 0 && !researchError && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter competitor names and run research to see live web findings.
            </p>
          )}

          <div className="space-y-4">
            {competitors.map((competitor, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                } hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                      } flex items-center justify-center`}
                    >
                      <span
                        className={`text-lg font-bold ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        {competitor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {competitor.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {competitor.marketPosition}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right max-w-xs">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{competitor.pricing}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Strengths: {competitor.strengths.join(', ') || '—'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Weaknesses: {competitor.weaknesses.join(', ') || '—'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        competitor.threat === 'High'
                          ? 'bg-red-100 text-red-800'
                          : competitor.threat === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {competitor.threat} Threat
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <SourcesList sources={sources} />
        </GlassCard>

        {/* Competitive Deals Monitor */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
            >
              <Eye className="h-5 w-5 mr-2 text-green-500" />
              Active Competitive Deals
            </h2>
            <ModernButton variant="outline" size="sm">
              View All Deals
            </ModernButton>
          </div>

          <div className="space-y-4">
            {competitiveDeals.length === 0 && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No open deals are marked as competitive. Tag a deal "competitive" or set its competitor field.
              </p>
            )}
            {competitiveDeals.slice(0, 5).map((deal) => (
              <div
                key={deal.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar size="sm" fallback={getContactInfo(deal.contactId).initials} />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deal.title}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getContactInfo(deal.contactId).name} • vs.{' '}
                      {dealCompetitor(deal)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        deal.probability > 60
                          ? 'bg-green-100 text-green-800'
                          : deal.probability >= 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {deal.probability}% probability
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Competitive Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
              >
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                Loss Reasons
              </h2>
            </div>

            <div className="space-y-4">
              {lossReasons.length === 0 && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No lost deals yet.</p>
              )}
              {lossReasons.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.reason}
                    </p>
                    <div
                      className={`w-full bg-gray-200 rounded-full h-2 mt-2 ${isDark ? 'bg-gray-700' : ''}`}
                    >
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.count}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>lost</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
              >
                <Target className="h-5 w-5 mr-2 text-purple-500" />
                Competitive Strategies
              </h2>
            </div>

            <div className="space-y-4">
              {strategies.length === 0 && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Run competitor research to get strategy suggestions.
                </p>
              )}
              {strategies.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    isDark
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.strategy}
                    </h3>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.rationale}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default CompetitorInsights;
