import React, { useState, useCallback } from 'react';
import { useContactAI } from '../../contexts/AIContext';
import { AvatarWithStatus } from '../ui/AvatarWithStatus';
import { CustomizableAIToolbar } from '../ui/CustomizableAIToolbar';
import { Contact } from '../../types';
import { useContactStore } from '../../store/contactStore';
import { aiEnrichmentService } from '../../services/aiEnrichmentService';
import { cacheService } from '../../services/cache.service';
import { httpClient } from '../../services/http-client.service';
import GeminiImageModal from '../GeminiImageModal';
import {
  Edit,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Mail,
  Phone,
  User,
  BarChart,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Star,
  Brain,
  Sparkles,
  Target,
  Zap,
  Camera,
  MessageSquare,
  Search,
  Image
} from 'lucide-react';
import { gpt5SocialResearchService } from '../../services/gpt5SocialResearchService';

interface AIEnhancedContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onAnalyze?: (contact: Contact) => Promise<boolean>;
  isAnalyzing?: boolean;
}

const interestColors = {
  hot: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  cold: 'bg-gray-400'
};

const interestLabels = {
  hot: 'Hot Client',
  medium: 'Medium Interest',
  low: 'Low Interest',
  cold: 'Non Interest'
};

const sourceColors: { [key: string]: string } = {
  'LinkedIn': 'bg-blue-600',
  'Facebook': 'bg-blue-500',
  'Email': 'bg-green-500',
  'Website': 'bg-purple-500',
  'Referral': 'bg-orange-500',
  'Typeform': 'bg-pink-500',
  'Cold Call': 'bg-gray-600'
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const AIEnhancedContactCard: React.FC<AIEnhancedContactCardProps> = ({
  contact,
  isSelected,
  onSelect,
  onClick,
  onAnalyze,
  isAnalyzing = false
}) => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [localAnalyzing, setLocalAnalyzing] = useState(false);
  const [isMultimodalEnriching, setIsMultimodalEnriching] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [showAvatarGenerator, setShowAvatarGenerator] = useState(false);
  // State for AI Score Explanation Tooltip
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);
  const [scoreExplanation, setScoreExplanation] = useState<string | null>(null);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  
  // Connect to AI services - using stubs for now
  const { updateContact } = useContactStore();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    onClick();
  };

  const handleAnalyzeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing || localAnalyzing) return;
    
    setLocalAnalyzing(true);
    console.log('Starting AI analysis for contact:', contact.id);
    try {
      // Simulate AI analysis for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newScore = Math.floor(Math.random() * 40) + 60;
      
      // Update the contact with AI score
      await updateContact(contact.id, { 
        aiScore: newScore,
        notes: contact.notes ? 
          `${contact.notes}\n\nAI Analysis: Analysis completed with score ${newScore}` :
          `AI Analysis: Analysis completed with score ${newScore}`
      });
      
      console.log('AI analysis completed');
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setLocalAnalyzing(false);
    }
  };

  // Function to fetch AI Score Explanation
  const fetchScoreExplanation = useCallback(async () => {
    if (!contact.aiScore) return; // Only fetch if there's an AI score

    setIsFetchingExplanation(true);
    setExplanationError(null);

    try {
      // Simulate explanation fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      const score = contact.aiScore;
      let explanation = '';
      
      if (score >= 80) {
        explanation = 'High conversion potential based on engagement patterns, company size, and expressed interest level.';
      } else if (score >= 60) {
        explanation = 'Good engagement potential with positive interaction history and suitable company profile.';
      } else if (score >= 40) {
        explanation = 'Moderate interest level with some engagement indicators but requires nurturing.';
      } else {
        explanation = 'Lower priority contact with limited engagement or qualification indicators.';
      }
      
      setScoreExplanation(explanation);
    } catch (err) {
      console.error('Failed to fetch score explanation:', err);
      setExplanationError('Failed to fetch explanation.');
    } finally {
      setIsFetchingExplanation(false);
    }
  }, [contact]); // Dependency array for useCallback

  // New handler for multimodal enrichment
  const handleMultimodalEnrichment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultimodalEnriching) return;

    setIsMultimodalEnriching(true);
    console.log('Starting multimodal enrichment for contact:', contact.id);
    try {
      if (contact.avatarSrc) {
        // Simulate multimodal enrichment
        await new Promise(resolve => setTimeout(resolve, 2000));
        const enrichedData = {
          inferredPersonalityTraits: 'Professional, analytical, detail-oriented',
          communicationStyle: 'Direct and concise',
          professionalDemeanor: 'Confident and approachable',
          imageAnalysisNotes: 'Professional headshot, formal attire, confident expression'
        };
        
        await updateContact(contact.id, enrichedData);
        console.log('Multimodal enrichment completed:', enrichedData);
      } else {
        console.warn('No avatar source found for multimodal enrichment.');
      }
    } catch (error) {
      console.error('Multimodal enrichment failed:', error);
    } finally {
      setIsMultimodalEnriching(false);
    }
  };

  const handleSocialResearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingSocial(true);
    try {
      const contactForResearch = {
        ...contact,
        lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date()
      };
      const research = await gpt5SocialResearchService.researchContactSocialMedia(
        contactForResearch,
        ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'],
        'comprehensive'
      );
      console.log('Social research completed:', research);
    } catch (error) {
      console.error('Social research failed:', error);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  const analyzing = isAnalyzing || localAnalyzing;

  // Check if multimodal data is present
  const hasMultimodalData = contact.inferredPersonalityTraits || contact.communicationStyle || contact.professionalDemeanor || contact.imageAnalysisNotes;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group relative border border-gray-200 hover:border-gray-300 overflow-hidden text-gray-900"
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-white border-gray-300"
        />
      </div>

      {/* Header Actions */}
      <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        {/* AI Analysis Button - Prominently Featured */}
        {onAnalyze && (
          <button 
            onClick={handleAnalyzeClick}
            disabled={analyzing}
            className={`p-2 rounded-lg transition-all duration-200 relative ${
              contact.aiScore 
                ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
            }`}
            title={contact.aiScore ? 'Re-analyze with AI' : 'Analyze with AI'}
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {!contact.aiScore && !analyzing && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </button>
        )}
        
        {/* Social Research Button */}
        <button
          onClick={handleSocialResearch}
          disabled={isLoadingSocial}
          className="p-2 rounded-lg transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          title="Social Media Research"
        >
          {isLoadingSocial ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
        
        {/* Multimodal Enrichment Button */}
        {contact.avatarSrc && (
          <button
            onClick={handleMultimodalEnrichment}
            disabled={isMultimodalEnriching}
            className={`p-2 rounded-lg transition-all duration-200 relative ${
              hasMultimodalData
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                : 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white hover:from-pink-600 hover:to-indigo-600 shadow-lg'
            }`}
            title={hasMultimodalData ? 'Re-enrich Multimodal' : 'Multimodal AI Enrichment'}
          >
            {isMultimodalEnriching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {!hasMultimodalData && !isMultimodalEnriching && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </button>
        )}

        {/* Avatar Generation Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAvatarGenerator(true);
          }}
          className="p-2 rounded-lg transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg"
          title="Generate Professional Avatar"
        >
          <Image className="w-4 h-4" />
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Handle edit action
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Handle more actions
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>

      <div className="p-6">
        {/* Avatar and AI Score Section */}
        <div className="flex items-start justify-between mb-4 mt-4">
          <div className="text-center flex-1">
            <div className="relative inline-block mb-3">
              <AvatarWithStatus
                src={contact.avatarSrc}
                alt={contact.name}
                size="lg"
                status={contact.status}
              />
              
              {/* Analysis Loading Indicator */}
              {analyzing && (
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {/* Multimodal Data Indicator */}
            {hasMultimodalData && (
              <div className="mt-2 flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-indigo-500" />
                <span className="text-xs text-indigo-700 font-medium">Multimodal insights available</span>
              </div>
            )}
            <h3 className="text-gray-900 font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
              {contact.name}
            </h3>
            <p className="text-gray-600 text-sm">{contact.position || contact.title}</p>
            <p className="text-gray-500 text-xs">{contact.company}</p>
          </div>
          
          {/* AI Score Display */}
          <div className="flex flex-col items-center space-y-2">
            {contact.aiScore ? (
              <div 
                className={`h-12 w-12 rounded-full ${getScoreColor(contact.aiScore)} text-white flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-white relative`}
                onMouseEnter={() => {
                  setShowScoreExplanation(true);
                  fetchScoreExplanation();
                }}
                onMouseLeave={() => setShowScoreExplanation(false)}
              >
                {contact.aiScore}
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300" />

                {/* Score Explanation Tooltip */}
                {showScoreExplanation && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-20">
                    {isFetchingExplanation ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Generating explanation...</span>
                      </div>
                    ) : explanationError ? (
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                        <span>{explanationError}</span>
                      </div>
                    ) : scoreExplanation ? (
                      <p>{scoreExplanation}</p>
                    ) : (
                      <p>Hover to see AI explanation for this score.</p>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAnalyzeClick}
                disabled={analyzing}
                className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-110 relative"
                title="Click to get AI score"
              >
                {analyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Brain className="w-5 h-5" />
                )}
                {!analyzing && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            )}
            <span className="text-xs text-gray-500 font-medium">
              {contact.aiScore ? 'AI Score' : 'Click to Score'}
            </span>
          </div>
        </div>

        {/* Interest Level */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${interestColors[contact.interestLevel as keyof typeof interestColors]} animate-pulse`} />
          <span className="text-xs text-gray-600 font-medium">
            {interestLabels[contact.interestLevel as keyof typeof interestLabels]}
          </span>
        </div>

        {/* Sources */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 text-center">Source</p>
          <div className="flex justify-center flex-wrap gap-1">
            {(contact.sources || [contact.source]).filter(Boolean).map((source, index) => (
              <span
                key={index}
                className={`
                  ${sourceColors[source as string] || 'bg-gray-600'} 
                  text-white text-xs px-2 py-1 rounded-md font-medium hover:scale-110 transition-transform cursor-pointer
                `}
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Interest Level Dots */}
        <div className="flex items-center justify-center space-x-1 mb-4">
          {Array.from({ length: 5 }, (_, i) => {
            const isActive = 
              (contact.interestLevel === 'hot' && i < 5) ||
              (contact.interestLevel === 'medium' && i < 3) ||
              (contact.interestLevel === 'low' && i < 2) ||
              (contact.interestLevel === 'cold' && i < 1);
            
            return (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? `${interestColors[contact.interestLevel as keyof typeof interestColors]} shadow-lg` 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>

        {/* AI Insights Section */}
        {contact.aiScore && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-blue-500" />
                AI Insights
              </h4>
              <div className="flex space-x-1">
                <button className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600">
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600">
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-900">
              {(() => {
                const score = contact.aiScore || 0;
                if (score >= 80) return 'High conversion potential - prioritize for immediate follow-up.';
                if (score >= 60) return 'Good engagement potential - schedule follow-up within 48 hours.';
                if (score >= 40) return 'Moderate interest - nurture with valuable content.';
                return 'Low engagement - consider re-qualification.';
              })()}
            </p>
            <div className="mt-2 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-700 font-medium">AI-powered analysis</span>
            </div>
          </div>
        )}

        {/* Traditional Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(`mailto:${contact.email}`, '_blank');
            }}
            className="flex items-center justify-center py-1.5 px-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full hover:from-blue-100 hover:to-blue-200 text-xs font-medium transition-all duration-200 border border-blue-200/50 shadow-sm"
          >
            <Mail className="w-3 h-3 mr-1" /> Email
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (contact.phone) window.open(`tel:${contact.phone}`, '_blank');
            }}
            className="flex items-center justify-center py-1.5 px-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full hover:from-green-100 hover:to-green-200 text-xs font-medium transition-all duration-200 border border-green-200/50 shadow-sm"
          >
            <Phone className="w-3 h-3 mr-1" /> Call
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex items-center justify-center py-1.5 px-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-full hover:from-purple-100 hover:to-purple-200 text-xs font-medium transition-all duration-200 border border-purple-200/50 shadow-sm"
          >
            <User className="w-3 h-3 mr-1" /> View
          </button>
        </div>

        {/* Click indicator */}
        <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-xs text-blue-500 font-medium">
            {contact.aiScore ? 'Click to view details' : 'Click AI button to score • Click card for details'}
          </p>
        </div>
      </div>

      {/* Avatar Generator Modal */}
      {showAvatarGenerator && (
        <GeminiImageModal
          open={showAvatarGenerator}
          onClose={() => setShowAvatarGenerator(false)}
        />
      )}
    </div>
  );
};

export default AIEnhancedContactCard;