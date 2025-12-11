import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { fetchBusinessAnalysis, createBusinessAnalysis } from '../../services/supabaseClient';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import StructuredAIResult from '../../components/shared/StructuredAIResult';
import { Brain, Building, Globe, Briefcase, ArrowRight, RefreshCw, Check, Loader2, AlertTriangle } from 'lucide-react';

interface BusinessAnalysisForm {
  businessName: string;
  industry: string;
  websiteUrl: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

const BusinessAnalyzer: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BusinessAnalysisForm>();
  const { user } = useAuthStore();
  
  const [businessAnalyses, setBusinessAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    loadBusinessAnalyses();
  }, []);
  
  const loadBusinessAnalyses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await fetchBusinessAnalysis(user?.id);
      if (error) {
        throw error;
      }
      setBusinessAnalyses(data || []);
    } catch (err) {
      console.error("Error loading business analyses:", err);
      setError('Failed to load business analyses');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: BusinessAnalysisForm) => {
    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Generate AI analysis using edge function
      const analysisResult = await edgeFunctionService.analyzeBusinessData(data);
      setAnalysisResults(analysisResult);
      
      // Save to Supabase
      const analysisData = {
        business_name: data.businessName,
        industry: data.industry,
        website_url: data.websiteUrl,
        social_links: data.socialLinks,
        analysis_results: { text: analysisResult },
        user_id: user?.id,
      };
      
      const { error } = await createBusinessAnalysis(analysisData);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Business analysis completed and saved successfully!');
      loadBusinessAnalyses(); // Reload data
      reset(); // Clear form
      
    } catch (err) {
      console.error(err);
      setError('Failed to analyze business or save results');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Analyzer</h1>
        <p className="text-gray-600 mt-1">Analyze businesses and get strategic insights</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-modern p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building size={22} className="mr-2 text-blue-600" />
              Business Analysis Tool
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register("businessName", { required: "Business name is required" })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter business name"
                  />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register("industry", { required: "Industry is required" })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. SaaS, Real Estate, E-commerce"
                  />
                </div>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="url"
                    {...register("websiteUrl", { 
                      required: "Website URL is required",
                      pattern: {
                        value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/,
                        message: "Please enter a valid URL"
                      }
                    })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. https://example.com"
                  />
                </div>
                {errors.websiteUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.websiteUrl.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Links (optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      {...register("socialLinks.linkedin")}
                      className="w-full pl-3 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("socialLinks.twitter")}
                      className="w-full pl-3 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Twitter URL"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("socialLinks.facebook")}
                      className="w-full pl-3 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Facebook URL"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("socialLinks.instagram")}
                      className="w-full pl-3 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instagram URL"
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
                  <Check size={18} className="mr-2" />
                  {success}
                </div>
              )}
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className={`w-full flex justify-center items-center gap-2 ${
                    isAnalyzing
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  } text-white py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Analyzing Business...
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      Analyze Business
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {analysisResults && (
            <StructuredAIResult 
              result={analysisResults} 
              title="Business Intelligence Analysis Report"
            />
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="card-modern p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Previous Analyses</h2>
            
            {isLoading ? (
              <div className="p-4 text-center">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-500">Loading analyses...</p>
              </div>
            ) : businessAnalyses.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-gray-300 rounded-lg">
                <Brain size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No business analyses yet</p>
                <p className="text-sm text-gray-400 mt-1">Your analyses will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessAnalyses.map((analysis) => (
                  <div key={analysis.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{analysis.business_name}</h3>
                        <p className="text-sm text-gray-500">{analysis.industry}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-blue-600 text-sm">
                      <span>View Analysis</span>
                      <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                <Brain size={20} />
              </div>
              <h3 className="text-lg font-medium">How It Works</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  <span className="text-xs font-medium">1</span>
                </div>
                <p className="text-sm">Enter business details including name, industry and website</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  <span className="text-xs font-medium">2</span>
                </div>
                <p className="text-sm">Our AI analyzes online presence, market position and reputation</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  <span className="text-xs font-medium">3</span>
                </div>
                <p className="text-sm">Get detailed insights on strengths, weaknesses, and opportunities</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  <span className="text-xs font-medium">4</span>
                </div>
                <p className="text-sm">Use insights for targeted outreach and personalized pitches</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalyzer;