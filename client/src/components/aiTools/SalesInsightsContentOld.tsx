import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import StructuredAIResult from '../shared/StructuredAIResult';
import { Brain, BarChart3, TrendingUp, ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';

const SalesInsightsContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDataDetails, setShowDataDetails] = useState(false);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For analysis purposes, we'll use example data
      const contacts = [
        { name: "John Doe", company: "Acme Inc", status: "customer", score: 85 },
        { name: "Jane Smith", company: "Globex Corp", status: "lead", score: 65 },
        { name: "Robert Johnson", company: "Initech", status: "prospect", score: 75 },
        { name: "Sarah Williams", company: "Umbrella Corp", status: "customer", score: 90 }
      ];
      
      const deals = [
        { title: "Enterprise License", value: 50000, stage: "negotiation", probability: 0.7 },
        { title: "Software Renewal", value: 25000, stage: "closed-won", probability: 1.0 },
        { title: "Premium Support", value: 15000, stage: "proposal", probability: 0.5 },
        { title: "Implementation Services", value: 30000, stage: "initial", probability: 0.3 }
      ];
      
      const result = await edgeFunctionService.generateSalesInsights(contacts, deals);
      setResult(result);
    } catch (err) {
      console.error('Error generating sales insights:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating sales insights');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <div className="flex items-start">
          <BarChart3 className="text-green-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-green-800">Sales Insights Generator</h3>
            <p className="text-sm text-green-700 mt-1">
              Get AI-powered insights and recommendations based on your CRM data to improve sales performance.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Analyzing your sales data..."
        resultTitle="Sales Performance Insights"
      >
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Sales Intelligence</h2>
          <p className="text-gray-600 mb-6">
            Our AI will analyze your contacts, deals, and activities to identify patterns, opportunities, and actionable recommendations to improve your sales performance.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Sample Data (For Demonstration)</h4>
              <button 
                onClick={() => setShowDataDetails(!showDataDetails)}
                className="text-sm text-blue-600 flex items-center"
              >
                {showDataDetails ? "Hide" : "Show"} Details
                {showDataDetails ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
            </div>
            
            {showDataDetails && (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Contacts (4):</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 pl-2">
                    <li>John Doe (Acme Inc) - Customer, Score: 85</li>
                    <li>Jane Smith (Globex Corp) - Lead, Score: 65</li>
                    <li>Robert Johnson (Initech) - Prospect, Score: 75</li>
                    <li>Sarah Williams (Umbrella Corp) - Customer, Score: 90</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Deals (4):</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 pl-2">
                    <li>Enterprise License: $50,000 (Negotiation, 70%)</li>
                    <li>Software Renewal: $25,000 (Closed Won, 100%)</li>
                    <li>Premium Support: $15,000 (Proposal, 50%)</li>
                    <li>Implementation Services: $30,000 (Initial, 30%)</li>
                  </ul>
                </div>
              </div>
            )}
            
            {!showDataDetails && (
              <p className="text-sm text-gray-600">This analysis will use sample CRM data including 4 contacts and 4 deals with a total pipeline value of $120,000.</p>
            )}
            
            <p className="text-xs text-gray-500 mt-3 italic">In a production environment, this would use your actual CRM data.</p>
          </div>
          
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors disabled:bg-green-300 mb-4"
          >
            {isLoading ? (
              <span className="animate-pulse">Generating insights...</span>
            ) : (
              <>
                <Brain size={18} />
                Generate Sales Insights
              </>
            )}
          </button>
        </div>
      </AIToolContent>
    </div>
  );
};

export default SalesInsightsContent;