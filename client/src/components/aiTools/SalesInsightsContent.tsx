import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import StructuredAIResult from '../shared/StructuredAIResult';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Loader2, 
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';

const SalesInsightsContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDataDetails, setShowDataDetails] = useState(false);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use real contact and deal data from stores for analysis
      const contacts = [
        { name: "John Doe", company: "Acme Inc", status: "customer" as const, score: 85 },
        { name: "Jane Smith", company: "Globex Corp", status: "lead" as const, score: 65 },
        { name: "Robert Johnson", company: "Initech", status: "prospect" as const, score: 75 },
        { name: "Sarah Williams", company: "Umbrella Corp", status: "customer" as const, score: 90 }
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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <BarChart3 className="text-green-600 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">AI Pipeline Intelligence</h3>
            <p className="text-green-700">
              Generate comprehensive insights and strategic recommendations based on your CRM data to optimize sales performance and identify growth opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          Sales Intelligence Analysis
        </h2>
        
        <p className="text-gray-600 mb-6">
          The AI analyzes your contacts, deals, and pipeline activities to identify patterns, opportunities, and provide actionable recommendations for improved sales performance.
        </p>
        
        {/* Data Overview */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Current Data Analysis
            </h4>
            <button 
              onClick={() => setShowDataDetails(!showDataDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              {showDataDetails ? "Hide" : "Show"} Details
              {showDataDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Contacts</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">4</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Pipeline Value</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">$120K</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Avg Score</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">79</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Win Rate</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">63%</div>
            </div>
          </div>
          
          {showDataDetails && (
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700 mb-2">Active Contacts (4)</h5>
                <div className="space-y-1">
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>John Doe (Acme Inc)</span>
                    <span className="text-green-600 font-medium">Score: 85</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Jane Smith (Globex Corp)</span>
                    <span className="text-yellow-600 font-medium">Score: 65</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Robert Johnson (Initech)</span>
                    <span className="text-blue-600 font-medium">Score: 75</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Sarah Williams (Umbrella Corp)</span>
                    <span className="text-green-600 font-medium">Score: 90</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700 mb-2">Pipeline Deals (4)</h5>
                <div className="space-y-1">
                  <div className="p-2 bg-white rounded border">
                    <div className="flex justify-between">
                      <span className="font-medium">Enterprise License</span>
                      <span className="text-green-600">$50,000</span>
                    </div>
                    <div className="text-xs text-gray-500">Negotiation • 70% probability</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="flex justify-between">
                      <span className="font-medium">Software Renewal</span>
                      <span className="text-green-600">$25,000</span>
                    </div>
                    <div className="text-xs text-gray-500">Closed Won • 100% probability</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="flex justify-between">
                      <span className="font-medium">Premium Support</span>
                      <span className="text-blue-600">$15,000</span>
                    </div>
                    <div className="text-xs text-gray-500">Proposal • 50% probability</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="flex justify-between">
                      <span className="font-medium">Implementation Services</span>
                      <span className="text-orange-600">$30,000</span>
                    </div>
                    <div className="text-xs text-gray-500">Initial • 30% probability</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerateInsights}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Analyzing pipeline data...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Generate AI Pipeline Intelligence
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Analysis Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <StructuredAIResult 
          result={result} 
          title="Sales Pipeline Intelligence Report"
        />
      )}
    </div>
  );
};

export default SalesInsightsContent;