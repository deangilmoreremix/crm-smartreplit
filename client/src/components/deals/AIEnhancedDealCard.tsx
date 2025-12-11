import React, { useState, useEffect } from 'react';
import { Building, Calendar, DollarSign, TrendingUp, User, Users, AlertCircle, CheckCircle, Clock, BarChart3, Target, Zap, Search, Globe } from 'lucide-react';
import { Deal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { gpt5SocialResearchService } from '../../services/gpt5SocialResearchService';

interface AiEnhancedDealCardProps {
  deal: Deal;
}

const AiEnhancedDealCard: React.FC<AiEnhancedDealCardProps> = ({ deal }) => {
  const { isDark } = useTheme();
  const { getContactById } = useContactStore();
  const contact = getContactById(deal.contactId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [socialProfilesCount, setSocialProfilesCount] = useState<number>(0);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  useEffect(() => {
    // Simulate AI analysis
    setInsights({
      score: 85,
      risk: 'low',
      nextAction: 'Schedule follow-up call',
      probability: deal.probability
    });

    // Load social profiles count
    loadSocialProfilesCount();
  }, [deal]);

  const loadSocialProfilesCount = async () => {
    if (!contact) return;

    setIsLoadingSocial(true);
    try {
      const research = await gpt5SocialResearchService.researchContactSocialMedia(
        contact,
        [],
        'basic'
      );
      setSocialProfilesCount(research.profiles.length);
    } catch (error) {
      console.error('Failed to load social profiles:', error);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`rounded-lg shadow-md p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Building className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.name}</h3>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="flex items-center space-x-4 text-xs mb-3">
        <div className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <Calendar className="h-3 w-3" />
          <span>{formatDate(deal.expectedCloseDate)}</span>
        </div>
        <div className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <User className="h-3 w-3" />
          <span>{contact?.name || 'Unknown'}</span>
        </div>
        {socialProfilesCount > 0 && (
          <div className={`flex items-center space-x-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            <Globe className="h-3 w-3" />
            <span>{socialProfilesCount} profiles</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AMOUNT</p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${deal.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>STAGE</p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.stage}</p>
            </div>
          </div>

          {insights && (
            <div className={`p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Insights</h4>
                <button
                  onClick={loadSocialProfilesCount}
                  disabled={isLoadingSocial}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors disabled:opacity-50`}
                >
                  <Search className="h-3 w-3 inline mr-1" />
                  {isLoadingSocial ? 'Researching...' : 'Social Research'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SCORE</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{insights.score}%</p>
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RISK</p>
                  <p className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{insights.risk?.toUpperCase()}</p>
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>PROBABILITY</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{insights.probability}%</p>
                </div>
                <div className="col-span-2">
                  <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>NEXT ACTION</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{insights.nextAction}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiEnhancedDealCard;