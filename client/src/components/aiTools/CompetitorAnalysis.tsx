import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedGemini } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { Shield, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Target } from 'lucide-react';

interface CompetitorData {
  competitorName: string;
  industry: string;
  ourCompany: string;
  analysisType: 'strengths_weaknesses' | 'pricing' | 'market_position' | 'full_analysis';
}

interface AnalysisResult {
  competitor: string;
  analysis: string;
  timestamp: string;
  analysisType: string;
}

const analysisTypeOptions = [
  { 
    value: 'strengths_weaknesses', 
    label: 'Strengths & Weaknesses', 
    description: 'Compare strengths and weaknesses',
    icon: BarChart3
  },
  { 
    value: 'pricing', 
    label: 'Pricing Analysis', 
    description: 'Analyze pricing strategies and positioning',
    icon: TrendingUp
  },
  { 
    value: 'market_position', 
    label: 'Market Position', 
    description: 'Compare market positioning and brand presence',
    icon: Target
  },
  { 
    value: 'full_analysis', 
    label: 'Full Analysis', 
    description: 'Comprehensive competitive analysis',
    icon: Shield
  }
];

export default function CompetitorAnalysis() {
  const { isDark } = useTheme();
  const { analyzeCompetitor } = useEnhancedGemini();
  
  const [competitorData, setCompetitorData] = useState<CompetitorData>({
    competitorName: '',
    industry: '',
    ourCompany: '',
    analysisType: 'strengths_weaknesses'
  });
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof CompetitorData, value: string | string[] | undefined) => {
    setCompetitorData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnalyze = async () => {
    if (!competitorData.competitorName || !competitorData.industry || !competitorData.ourCompany) {
      setError('Please fill in all required fields');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSuccess(false);
    
    const startTime = Date.now();

    try {
      const result = await analyzeCompetitor(competitorData);
      setAnalysisResult(result);
      setSuccess(true);

      // Track usage
      await aiUsageTracker.trackUsage({
        toolId: 'competitor-analysis',
        toolName: 'Competitor Analysis',
        category: 'Core AI Tools',
        executionTime: Date.now() - startTime,
        success: true,
        customerId: 'current-user'
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze competitor';
      setError(errorMsg);
      
      // Track failed usage
      await aiUsageTracker.trackUsage({
        toolId: 'competitor-analysis',
        toolName: 'Competitor Analysis',
        category: 'Core AI Tools',
        executionTime: Date.now() - startTime,
        success: false,
        error: errorMsg,
        customerId: 'current-user'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysis = (analysis: string) => {
    // Split the analysis into sections for better readability
    const sections = analysis.split('\n\n').filter(section => section.trim());
    return sections;
  };

  const getAnalysisIcon = (type: string) => {
    const option = analysisTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : Shield;
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl mr-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Competitor Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze competitors and identify market opportunities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-6">Analysis Parameters</h2>
          
          {/* Basic Information */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Competitor Name *</label>
              <input
                type="text"
                value={competitorData.competitorName}
                onChange={(e) => handleInputChange('competitorName', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter competitor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Company Name *</label>
              <input
                type="text"
                value={competitorData.ourCompany}
                onChange={(e) => handleInputChange('ourCompany', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Industry *</label>
              <input
                type="text"
                value={competitorData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., SaaS, E-commerce, Healthcare"
              />
            </div>
          </div>

          {/* Analysis Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Analysis Type *</label>
            <div className="grid grid-cols-1 gap-3">
              {analysisTypeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <label key={option.value} className={`flex items-start cursor-pointer p-3 rounded-lg border transition-colors ${
                    competitorData.analysisType === option.value
                      ? isDark 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-blue-500 bg-blue-50'
                      : isDark 
                        ? 'border-gray-600 hover:border-gray-500' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="analysisType"
                      value={option.value}
                      checked={competitorData.analysisType === option.value}
                      onChange={(e) => handleInputChange('analysisType', e.target.value as any)}
                      className="mt-1 mr-3 text-blue-500 focus:ring-blue-500"
                    />
                    <IconComponent className="w-5 h-5 mr-3 mt-0.5 text-blue-500" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Competitor...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Analyze Competitor
              </>
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Analysis completed successfully!</span>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
            {analysisResult && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4 mr-1" />
                {new Date(analysisResult.timestamp).toLocaleDateString()}
              </div>
            )}
          </div>

          {analysisResult ? (
            <div className="space-y-6">
              {/* Analysis Header */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  {React.createElement(getAnalysisIcon(analysisResult.analysisType), { 
                    className: "w-5 h-5 mr-2 text-blue-500" 
                  })}
                  <h3 className="font-semibold">{analysisResult.competitor} Analysis</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysisTypeOptions.find(opt => opt.value === analysisResult.analysisType)?.description}
                </p>
              </div>

              {/* Analysis Content */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              } max-h-96 overflow-y-auto`}>
                <div className="space-y-4">
                  {formatAnalysis(analysisResult.analysis).map((section, index) => (
                    <div key={index} className="space-y-2">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {section}
                      </div>
                      {index < formatAnalysis(analysisResult.analysis).length - 1 && (
                        <hr className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-200'} border`}>
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">Opportunities</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Areas where you can gain competitive advantage
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20 border-orange-500' : 'bg-orange-50 border-orange-200'} border`}>
                  <div className="flex items-center mb-2">
                    <TrendingDown className="w-4 h-4 mr-2 text-orange-500" />
                    <span className="font-medium text-orange-700 dark:text-orange-300">Threats</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Areas where competitor has advantages
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Your competitor analysis will appear here</p>
              <p className="text-sm mt-2">Enter competitor details and click analyze to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
