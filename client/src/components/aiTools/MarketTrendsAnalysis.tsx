import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { enhancedGeminiService } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { TrendingUp, Download, Search, BarChart3, Globe, Target, Users, DollarSign } from 'lucide-react';

export default function MarketTrendsAnalysis() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<{
    industry: string;
    region: string;
    timeframe: string;
    focusAreas: string[];
    includeCompetitors: boolean;
    includeForecast: boolean;
  }>({
    industry: '',
    region: 'Global',
    timeframe: '12',
    focusAreas: [],
    includeCompetitors: false,
    includeForecast: true
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Real Estate', 'Education', 'Automotive', 'Energy', 'Entertainment'
  ];

  const regions = ['Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
  
  const focusAreaOptions = [
    'Market Size', 'Growth Rate', 'Consumer Behavior', 'Technology Adoption',
    'Regulatory Changes', 'Investment Trends', 'Emerging Players', 'Digital Transformation'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const generateAnalysis = async () => {
    if (!formData.industry) {
      alert('Please select an industry');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Map timeframe to expected format
      let timeframe: '3months' | '6months' | '1year' | '2years';
      switch (formData.timeframe) {
        case '3':
          timeframe = '3months';
          break;
        case '6':
          timeframe = '6months';
          break;
        case '12':
          timeframe = '1year';
          break;
        case '24':
          timeframe = '2years';
          break;
        default:
          timeframe = '1year';
      }

      const result = await enhancedGeminiService.analyzeMarketTrends({
        industry: formData.industry,
        timeframe: timeframe,
        focusAreas: formData.focusAreas.length > 0 ? formData.focusAreas : undefined
      });

      setAnalysis(result);

      // Track usage
      aiUsageTracker.trackUsage({
        toolId: 'market-trends',
        toolName: 'Market Trends Analysis',
        category: 'Analytics',
        executionTime: Date.now() - startTime,
        success: true
      });
    } catch (error) {
      console.error('Error generating market trends analysis:', error);
      alert('Failed to generate analysis. Please try again.');
      
      aiUsageTracker.trackUsage({
        toolId: 'market-trends',
        toolName: 'Market Trends Analysis',
        category: 'Analytics',
        executionTime: Date.now() - startTime,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;

    const reportContent = `
MARKET TRENDS ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
Industry: ${formData.industry}
Region: ${formData.region}
Timeframe: ${formData.timeframe} months

${analysis.summary}

KEY FINDINGS:
${analysis.keyFindings?.map((finding: string, index: number) => `${index + 1}. ${finding}`).join('\n') || 'No key findings available'}

GROWTH PROJECTIONS:
${analysis.growthProjections || 'No growth projections available'}

OPPORTUNITIES:
${analysis.opportunities?.map((opp: string, index: number) => `${index + 1}. ${opp}`).join('\n') || 'No opportunities identified'}

RISKS:
${analysis.risks?.map((risk: string, index: number) => `${index + 1}. ${risk}`).join('\n') || 'No risks identified'}

RECOMMENDATIONS:
${analysis.recommendations?.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n') || 'No recommendations available'}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-trends-${formData.industry}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className="space-y-4 sm:space-y-6 p-4 sm:p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold">Market Trends Analysis</h2>
        </div>
        <AnimatePresence>
          {analysis && (
            <motion.button
              onClick={downloadReport}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-manipulation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Configuration Form */}
      <motion.div 
        className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold mb-4">Analysis Configuration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Industry Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2">Industry *</label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Select Industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </motion.div>

          {/* Region Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2">Region</label>
            <select
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </motion.div>

          {/* Timeframe */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2">Analysis Timeframe</label>
            <select
              value={formData.timeframe}
              onChange={(e) => handleInputChange('timeframe', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
            </select>
          </motion.div>

          {/* Options */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <label className="block text-sm font-medium">Additional Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeCompetitors}
                  onChange={(e) => handleInputChange('includeCompetitors', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Include Competitor Analysis</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeForecast}
                  onChange={(e) => handleInputChange('includeForecast', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Include Future Forecast</span>
              </label>
            </div>
          </motion.div>
        </div>

        {/* Focus Areas */}
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <label className="block text-sm font-medium mb-3">Focus Areas (Optional)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {focusAreaOptions.map(area => (
              <label key={area} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.focusAreas.includes(area)}
                  onChange={() => toggleFocusArea(area)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">{area}</span>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <motion.button
            onClick={generateAnalysis}
            disabled={isLoading || !formData.industry}
            className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Market Trends...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Generate Analysis
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            {/* Summary */}
            <motion.div 
              className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Executive Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.summary}
              </p>
            </motion.div>

            {/* Key Metrics Grid */}
            {analysis.metrics && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <motion.div 
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Market Growth</p>
                      <p className="text-2xl font-bold">{analysis.metrics.marketGrowth || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Market Size</p>
                      <p className="text-2xl font-bold">{analysis.metrics.marketSize || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg mr-4">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Key Players</p>
                      <p className="text-2xl font-bold">{analysis.metrics.keyPlayers || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Key Findings */}
            {analysis.keyFindings && (
              <motion.div 
                className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {analysis.keyFindings.map((finding: string, index: number) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                    >
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700 dark:text-gray-300">{finding}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Opportunities & Risks */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              {analysis.opportunities && (
                <motion.div 
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-lg font-semibold mb-4 text-green-600">Opportunities</h3>
                  <ul className="space-y-2">
                    {analysis.opportunities.map((opportunity: string, index: number) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                      >
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700 dark:text-gray-300">{opportunity}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {analysis.risks && (
                <motion.div 
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-lg font-semibold mb-4 text-red-600">Risks</h3>
                  <ul className="space-y-2">
                    {analysis.risks.map((risk: string, index: number) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + index * 0.1, duration: 0.3 }}
                      >
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>

            {/* Recommendations */}
            {analysis.recommendations && (
              <motion.div 
                className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Strategic Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((recommendation: string, index: number) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6 + index * 0.1, duration: 0.3 }}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-bold mr-3 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
