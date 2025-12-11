import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import AIToolContent from '../shared/AIToolContent';
import FileUpload from '../shared/FileUpload';
import { TrendingUp, ChevronRight } from 'lucide-react';

const MarketTrendContent: React.FC = () => {
  const [formData, setFormData] = useState({
    industry: '',
    targetMarket: '',
    timeframe: '6 months',
    additionalContext: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.industry || !formData.targetMarket) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const analysisResult = await edgeFunctionService.analyzeMarketTrends(
        formData.industry,
        formData.targetMarket,
        formData.timeframe
      );
      setResult(analysisResult);
    } catch (err) {
      console.error('Error analyzing market trends:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing market trends');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(newFiles);
    
    // In a real app, we would extract market data from the files
    if (newFiles.length > 0) {
      setTimeout(() => {
        setFormData({
          ...formData,
          additionalContext: formData.additionalContext + "\n\nData from uploaded files would be processed here."
        });
      }, 1000);
    }
  };

  // Industry suggestions
  const industryOptions = [
    'Software & Technology',
    'Financial Services',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Education',
    'Professional Services',
    'Real Estate',
    'Transportation',
    'Energy & Utilities',
    'Media & Entertainment',
    'Telecommunications'
  ];

  // Market segment suggestions
  const marketOptions = [
    'Small Business',
    'Mid-Market',
    'Enterprise',
    'B2B',
    'B2C',
    'Government',
    'Education',
    'Healthcare Providers',
    'Financial Institutions',
    'E-commerce'
  ];

  // Timeframe options
  const timeframeOptions = [
    { value: '3 months', label: 'Next 3 months' },
    { value: '6 months', label: 'Next 6 months' },
    { value: '12 months', label: 'Next 12 months' },
    { value: '2 years', label: 'Next 2 years' },
    { value: '5 years', label: 'Next 5 years' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
        <div className="flex items-start">
          <TrendingUp className="text-cyan-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-cyan-800">Market Trend Analysis</h3>
            <p className="text-sm text-cyan-700 mt-1">
              Get insights on industry trends, market opportunities, and strategic recommendations for your target market.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Analyzing market trends..."
        resultTitle="Market Trend Analysis"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <div className="relative">
              <input
                list="industry-options"
                id="industry"
                name="industry"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="e.g. Software & Technology, Healthcare"
                value={formData.industry}
                onChange={handleChange}
                required
              />
              <datalist id="industry-options">
                {industryOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-1">
              Target Market / Segment
            </label>
            <div className="relative">
              <input
                list="market-options"
                id="targetMarket"
                name="targetMarket"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="e.g. Enterprise businesses, Healthcare providers"
                value={formData.targetMarket}
                onChange={handleChange}
                required
              />
              <datalist id="market-options">
                {marketOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              id="timeframe"
              name="timeframe"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              value={formData.timeframe}
              onChange={handleChange}
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context (Optional)
            </label>
            <textarea
              id="additionalContext"
              name="additionalContext"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Any specific areas of interest or additional context for the analysis"
              value={formData.additionalContext}
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Upload Market Reports (Optional)
            </p>
            <FileUpload 
              fileType="document"
              onFilesAdded={handleFilesAdded}
              maxFiles={2}
              accept={{
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'text/csv': ['.csv']
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload relevant market reports or data sheets to enhance your analysis.
            </p>
          </div>
            
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              Analysis includes: trends, opportunities, challenges, and recommendations
            </div>
            <button
              type="submit"
              disabled={isLoading || !formData.industry || !formData.targetMarket}
              className="px-4 py-2 inline-flex items-center bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-cyan-300 disabled:cursor-not-allowed transition-colors"
            >
              Generate Analysis
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </form>
      </AIToolContent>
    </div>
  );
};

export default MarketTrendContent;