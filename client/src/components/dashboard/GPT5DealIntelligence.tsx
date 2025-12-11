import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Target, Brain, AlertCircle, TrendingUp, Clock, DollarSign, User, Zap } from 'lucide-react';
import { gpt5Service } from '../../services/gpt5Service';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';

interface DealIntelligence {
  dealId: string;
  dealTitle: string;
  winProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFactors: string[];
  recommendations: string[];
  expectedOutcome: string;
  confidence: number;
  timeToClose: number; // days
  valueOptimization: number; // potential additional value
}

interface DealInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const GPT5DealIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const [dealIntelligence, setDealIntelligence] = useState<DealIntelligence[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [insights, setInsights] = useState<DealInsight[]>([]);

  // Get active deals with contact data
  const getActiveDealsWithContacts = () => {
    return Object.values(deals)
      .filter(deal => deal.stage !== 'won' && deal.stage !== 'lost')
      .map(deal => ({
        ...deal,
        contact: contacts[deal.contactId]
      }))
      .filter(deal => deal.contact);
  };

  // GPT-5 Deal Intelligence Analysis
  const analyzeDealIntelligence = async () => {
    const activeDeals = getActiveDealsWithContacts();
    if (activeDeals.length === 0) return;

    setIsAnalyzing(true);
    try {
      const intelligenceResults = await Promise.all(
        activeDeals.slice(0, 5).map(async (deal) => { // Analyze top 5 deals
          const dealData = {
            id: deal.id,
            title: deal.title,
            value: deal.value,
            stage: deal.stage,
            probability: deal.probability,
            expectedCloseDate: deal.expectedCloseDate,
            description: deal.description
          };

          const contactHistory = {
            contact: deal.contact,
            industry: deal.contact?.industry,
            company: deal.contact?.company,
            position: deal.contact?.position
          };

          const marketContext = {
            industry: deal.contact?.industry || 'general',
            dealSize: deal.value,
            competition: 'moderate',
            timing: 'good'
          };

          try {
            // Call GPT-5 Expert Deal Intelligence
            const analysis = await gpt5Service.analyzeDealIntelligence(
              dealData,
              contactHistory,
              marketContext
            );

            return {
              dealId: deal.id.toString(),
              dealTitle: deal.title,
              winProbability: analysis.probability_score || deal.probability || 0,
              riskLevel: analysis.risk_level || 'medium',
              keyFactors: analysis.key_factors || ['Stage progression', 'Contact engagement'],
              recommendations: analysis.recommendations || ['Follow up regularly', 'Schedule demo'],
              expectedOutcome: analysis.expected_outcome || 'Positive outlook',
              confidence: analysis.confidence_level === 'high' ? 0.9 : 
                         analysis.confidence_level === 'medium' ? 0.7 : 0.5,
              timeToClose: analysis.estimated_close_days || 30,
              valueOptimization: analysis.value_optimization || 0
            } as DealIntelligence;

          } catch (error) {
            console.error('Deal analysis error:', error);
            // Fallback analysis
            return {
              dealId: deal.id.toString(),
              dealTitle: deal.title,
              winProbability: deal.probability || 50,
              riskLevel: 'medium' as const,
              keyFactors: ['Regular follow-up needed', 'Decision timeline unclear'],
              recommendations: ['Schedule next meeting', 'Confirm budget authority'],
              expectedOutcome: 'Requires attention',
              confidence: 0.6,
              timeToClose: 30,
              valueOptimization: Number(deal.value) * 0.1
            };
          }
        })
      );

      setDealIntelligence(intelligenceResults);

      // Generate overall insights
      const overallInsights: DealInsight[] = [
        {
          title: 'High-Priority Opportunities',
          description: `${intelligenceResults.filter(d => d.winProbability > 70).length} deals show strong win probability`,
          priority: 'high',
          actionable: true
        },
        {
          title: 'Risk Mitigation Required',
          description: `${intelligenceResults.filter(d => d.riskLevel === 'high').length} deals need immediate attention`,
          priority: 'high',
          actionable: true
        },
        {
          title: 'Value Optimization Potential',
          description: `$${intelligenceResults.reduce((sum, d) => sum + d.valueOptimization, 0).toLocaleString()} in additional revenue possible`,
          priority: 'medium',
          actionable: true
        }
      ];

      setInsights(overallInsights);

    } catch (error) {
      console.error('GPT-5 Deal Intelligence Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(analyzeDealIntelligence, 3000);
    return () => clearTimeout(timer);
  }, [deals, contacts]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return isDark ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100';
      case 'high': return isDark ? 'text-orange-400 bg-orange-500/20' : 'text-orange-600 bg-orange-100';
      case 'medium': return isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-100';
      case 'low': return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100';
      default: return isDark ? 'text-gray-400 bg-gray-500/20' : 'text-gray-600 bg-gray-100';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return isDark ? 'text-green-400' : 'text-green-600';
    if (probability >= 60) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (probability >= 40) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-4 rounded-xl border ${
        isDark 
          ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10' 
          : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
            }`}>
              <Target className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                GPT-5 Deal Intelligence
              </h3>
              <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                Advanced deal analysis and win probability forecasting
              </p>
            </div>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="animate-spin">
                <Brain className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <span className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Analyzing deals...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Insights Overview */}
      {insights.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  insight.priority === 'high' 
                    ? isDark ? 'bg-red-400' : 'bg-red-500'
                    : isDark ? 'bg-yellow-400' : 'bg-yellow-500'
                }`} />
                <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {insight.title}
                </h4>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Deal Intelligence Cards */}
      <div className="space-y-4">
        <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Brain className="h-4 w-4" />
          Individual Deal Analysis
        </h4>
        
        <div className="grid gap-4">
          {dealIntelligence.map((intelligence) => (
            <div key={intelligence.dealId} className={`p-4 rounded-lg border ${
              isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
            } hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() => setSelectedDeal(selectedDeal === intelligence.dealId ? null : intelligence.dealId)}>
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {intelligence.dealTitle}
                    </h5>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(intelligence.riskLevel)}`}>
                      {intelligence.riskLevel} risk
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span className={`font-medium ${getProbabilityColor(intelligence.winProbability)}`}>
                        {intelligence.winProbability}% win probability
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {intelligence.timeToClose} days to close
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Zap className={`h-3 w-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {Math.round(intelligence.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Optimization Potential
                  </div>
                  <div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    +${intelligence.valueOptimization.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              {selectedDeal === intelligence.dealId && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                  <div>
                    <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Key Factors
                    </h6>
                    <ul className="space-y-1">
                      {intelligence.keyFactors.map((factor, index) => (
                        <li key={index} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                          <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      GPT-5 Recommendations
                    </h6>
                    <ul className="space-y-1">
                      {intelligence.recommendations.map((rec, index) => (
                        <li key={index} className={`text-xs ${isDark ? 'text-green-300' : 'text-green-600'} flex items-center gap-2`}>
                          <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`} />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        GPT-5 Analysis
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                      {intelligence.expectedOutcome}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {dealIntelligence.length === 0 && !isAnalyzing && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active deals to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPT5DealIntelligence;