import React, { useState } from 'react';
import { useGemini } from '../../services/geminiService';
import AIToolContent from '../shared/AIToolContent';
import { Shield, User, Building, RefreshCw, Copy, FileText, List, Check } from 'lucide-react';

const ObjectionHandlerContent: React.FC = () => {
  const [formData, setFormData] = useState({
    objection: '',
    productInfo: '',
    industry: '',
    dealStage: 'prospecting'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gemini = useGemini();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.objection || !formData.productInfo) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Enhance product info with industry and deal stage context
      const enhancedProductInfo = `
        Product/Service Info: ${formData.productInfo}
        Industry: ${formData.industry}
        Deal Stage: ${formData.dealStage}
      `;

      const objectionHandler = await gemini.generateObjectionHandler(
        formData.objection,
        enhancedProductInfo
      );
      
      setResult(objectionHandler);
      setCopied(false);
    } catch (err) {
      console.error('Error generating objection handler:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the objection handler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Common objections for quick selection
  const commonObjections = [
    "Your product is too expensive",
    "We're already using a competitor",
    "We don't have budget right now",
    "I need to think about it",
    "I need to discuss with my team",
    "We're not ready to make a change",
    "I don't see the value",
    "We're happy with our current solution"
  ];
  
  // Deal stages
  const dealStages = [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'needs_analysis', label: 'Needs Analysis' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closing', label: 'Closing' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-start">
          <Shield className="text-indigo-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-indigo-800">Objection Handler</h3>
            <p className="text-sm text-indigo-700 mt-1">
              Get expert strategies for handling common sales objections. Turn obstacles into opportunities with personalized objection responses.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Creating objection strategy..."
        resultTitle="Objection Handling Strategy"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objection to Address
            </label>
            <textarea
              name="objection"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What objection are you facing? (e.g., 'Your product is too expensive for us')"
              value={formData.objection}
              onChange={handleChange}
              required
            ></textarea>
            
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Common objections:</p>
              <div className="flex flex-wrap gap-2">
                {commonObjections.map((objection, index) => (
                  <button
                    key={index}
                    type="button"
                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                    onClick={() => setFormData({...formData, objection})}
                  >
                    {objection}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry (Optional)
              </label>
              <input
                name="industry"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Healthcare, Tech, Finance"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Stage
              </label>
              <select
                name="dealStage"
                value={formData.dealStage}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {dealStages.map(stage => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product/Service Information
            </label>
            <textarea
              name="productInfo"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Briefly describe your product/service, key benefits, and value proposition"
              value={formData.productInfo}
              onChange={handleChange}
              required
            ></textarea>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.objection.trim() || !formData.productInfo.trim()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield size={18} className="mr-2" />
                  Generate Strategy
                </>
              )}
            </button>
          </div>
        </form>
      </AIToolContent>

      {result && !isLoading && !error && (
        <div className="mt-6">
          <div className="flex justify-end space-x-2 mb-2">
            <button 
              onClick={handleCopy}
              className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
              <List size={16} className="mr-1" />
              Save to Objection Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectionHandlerContent;