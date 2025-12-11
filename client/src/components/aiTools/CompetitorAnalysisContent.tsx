import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import FileUpload from '../shared/FileUpload';
import AIToolContent from '../shared/AIToolContent';
import { FileSearch, PlusCircle, Trash, Link } from 'lucide-react';

const CompetitorAnalysisContent: React.FC = () => {
  const [formData, setFormData] = useState({
    competitorName: '',
    industry: 'SaaS CRM',
    strengths: ['AI-powered lead scoring and insights', 'Seamless integration with marketing tools']
  });
  
  const [competitorWebsite, setCompetitorWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const addStrength = () => {
    setFormData({
      ...formData,
      strengths: [...formData.strengths, '']
    });
  };

  const removeStrength = (index: number) => {
    setFormData({
      ...formData,
      strengths: formData.strengths.filter((_, i) => i !== index)
    });
  };

  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...formData.strengths];
    newStrengths[index] = value;
    setFormData({
      ...formData,
      strengths: newStrengths
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.competitorName) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Filter out empty strengths
      const strengths = formData.strengths.filter(item => item.trim() !== '');
      
      const analysisResult = await edgeFunctionService.analyzeCompetitor(
        formData.competitorName,
        formData.industry,
        strengths
      );
      setResult(analysisResult);
    } catch (err) {
      console.error('Error analyzing competitor:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the competitor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(newFiles);
    
    // In a real app, we would extract info from the file
    // For demo purposes, just acknowledge
    if (newFiles.length > 0) {
      setTimeout(() => {
        setError("Document analysis would be processed on the server in a production environment.");
      }, 1000);
    }
  };

  // Industry options
  const industryOptions = [
    'SaaS CRM',
    'Marketing Automation',
    'Enterprise Software',
    'E-commerce Platforms',
    'FinTech',
    'Healthcare IT',
    'EdTech',
    'Real Estate Software',
    'Productivity Tools',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <div className="flex items-start">
          <FileSearch className="text-amber-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-amber-800">Competitor Analysis</h3>
            <p className="text-sm text-amber-700 mt-1">
              Analyze competitors and develop effective differentiation strategies. Get insights on their strengths, weaknesses, and how to position against them.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Analyzing competitor..."
        resultTitle="Competitor Analysis"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="competitorName" className="block text-sm font-medium text-gray-700 mb-1">
                Competitor Name
              </label>
              <input
                id="competitorName"
                name="competitorName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g. Salesforce, HubSpot"
                value={formData.competitorName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              >
                {industryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="competitorWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Competitor Website (Optional)
            </label>
            <div className="flex">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="competitorWebsite"
                  type="url"
                  className="w-full pl-10 p-2 border border-gray-300 rounded-l-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. https://example.com"
                  value={competitorWebsite}
                  onChange={(e) => setCompetitorWebsite(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200"
                onClick={() => {
                  if (competitorWebsite) {
                    // In a real app, we would analyze the website
                    setError("Website analysis would be processed on the server in a production environment.");
                  }
                }}
              >
                Analyze
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Key Strengths/Differentiators
            </label>
            
            <div className="space-y-3">
              {formData.strengths.map((strength, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => updateStrength(index, e.target.value)}
                    placeholder="e.g. AI-powered lead scoring"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeStrength(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                    disabled={formData.strengths.length <= 1}
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addStrength}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add another strength
              </button>
            </div>
          </div>
            
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Upload Competitor Materials (Optional)
            </p>
            <FileUpload 
              fileType="document"
              onFilesAdded={handleFilesAdded}
              maxFiles={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add competitor marketing materials, pricing sheets, or product documentation for enhanced analysis.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.competitorName.trim() || formData.strengths.filter(s => s.trim()).length === 0}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Competitor
            </button>
          </div>
        </form>
      </AIToolContent>
    </div>
  );
};

export default CompetitorAnalysisContent;