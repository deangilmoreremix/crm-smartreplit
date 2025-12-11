import React, { useState, useEffect } from 'react';
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

const BusinessAnalysis: React.FC = () => {
  const [businessAnalyses, setBusinessAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  
  // Mock previous analyses
  useEffect(() => {
    const mockAnalyses = [
      {
        id: '1',
        business_name: 'TechStartup Inc.',
        industry: 'Technology',
        website_url: 'https://techstartup.example.com',
        analysis_results: {
          text: 'This technology startup shows strong potential in the SaaS market with innovative cloud solutions...'
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        business_name: 'Local Restaurant',
        industry: 'Food Service',
        website_url: 'https://restaurant.example.com',
        analysis_results: {
          text: 'This local restaurant has good online presence but could improve social media engagement...'
        },
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    setBusinessAnalyses(mockAnalyses);
  }, []);
  
  const loadBusinessAnalyses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from API
      // Using mock data from useEffect
    } catch (err) {
      console.error("Error loading business analyses:", err);
      setError('Failed to load business analyses');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData: BusinessAnalysisForm = {
        businessName,
        industry,
        websiteUrl,
        socialLinks: {
          linkedin: linkedinUrl || undefined,
          twitter: twitterUrl || undefined,
          facebook: facebookUrl || undefined,
          instagram: instagramUrl || undefined
        }
      };
      
      // Simulate AI analysis
      const analysisResult = `
## Business Analysis for ${businessName}

### Industry Overview
${businessName} operates in the ${industry} sector, which presents both opportunities and challenges in the current market landscape.

### Digital Presence Assessment
- Website: ${websiteUrl}
- Social Media Presence: ${Object.values(formData.socialLinks).filter(Boolean).length > 0 ? 'Active on multiple platforms' : 'Limited social media presence'}

### Key Findings
1. **Market Position**: The company shows potential for growth in their target market
2. **Digital Strategy**: ${websiteUrl ? 'Strong web presence' : 'Needs improved online visibility'}
3. **Social Engagement**: ${Object.values(formData.socialLinks).filter(Boolean).length > 2 ? 'Well-established social media strategy' : 'Opportunity to enhance social media engagement'}

### Recommendations
- Focus on digital marketing to increase brand awareness
- Leverage social media platforms for customer engagement
- Consider SEO optimization for better online visibility
- Implement customer feedback systems for continuous improvement

### Growth Opportunities
The ${industry} industry is experiencing steady growth, making this an opportune time for strategic expansion and market penetration.
      `.trim();
      
      setAnalysisResults(analysisResult);
      
      // Save to mock state
      const newAnalysis = {
        id: Date.now().toString(),
        business_name: businessName,
        industry: industry,
        website_url: websiteUrl,
        social_links: formData.socialLinks,
        analysis_results: { text: analysisResult },
        created_at: new Date().toISOString(),
      };
      
      setBusinessAnalyses([newAnalysis, ...businessAnalyses]);
      setSuccess('Business analysis completed successfully!');
      
      // Reset form
      setBusinessName('');
      setIndustry('');
      setWebsiteUrl('');
      setLinkedinUrl('');
      setTwitterUrl('');
      setFacebookUrl('');
      setInstagramUrl('');
      
    } catch (error) {
      console.error('Error generating analysis:', error);
      setError('Failed to generate business analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Analysis</h1>
        <p className="text-gray-600">Analyze businesses and get AI-powered insights</p>
      </header>

      {/* Analysis Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center mb-6">
          <Brain className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">New Business Analysis</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter business name"
              />
            </div>
            
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <input
                type="text"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Technology, Healthcare, Retail"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL *
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Social Media Links (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="linkedinUrl" className="block text-xs text-gray-600 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              
              <div>
                <label htmlFor="twitterUrl" className="block text-xs text-gray-600 mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitterUrl"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="https://twitter.com/..."
                />
              </div>
              
              <div>
                <label htmlFor="facebookUrl" className="block text-xs text-gray-600 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  id="facebookUrl"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="https://facebook.com/..."
                />
              </div>
              
              <div>
                <label htmlFor="instagramUrl" className="block text-xs text-gray-600 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isAnalyzing || !businessName || !industry || !websiteUrl}
            className="w-full md:w-auto inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Analyzing Business...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </button>
        </form>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <Check className="h-4 w-4 mr-2" />
          {success}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
            Analysis Results
          </h3>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
              {analysisResults}
            </div>
          </div>
        </div>
      )}

      {/* Previous Analyses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <Building className="h-5 w-5 mr-2 text-gray-600" />
            Previous Analyses
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Loading analyses...</p>
          </div>
        ) : businessAnalyses.length === 0 ? (
          <div className="p-8 text-center">
            <Brain size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No business analyses yet</p>
            <p className="text-sm text-gray-400">Create your first analysis above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {businessAnalyses.map((analysis) => (
              <div key={analysis.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{analysis.business_name}</h4>
                    <p className="text-sm text-gray-500">{analysis.industry}</p>
                    {analysis.website_url && (
                      <a
                        href={analysis.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center mt-1"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {analysis.website_url}
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {analysis.analysis_results && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                      {analysis.analysis_results.text.substring(0, 300)}...
                    </div>
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center">
                      View Full Analysis
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAnalysis;