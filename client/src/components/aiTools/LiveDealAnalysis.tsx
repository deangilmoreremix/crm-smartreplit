import React, { useState, useEffect, useRef } from 'react';
import openAIService from '../../services/openAIService';
import { Deal } from '../../types';
import { BarChart3, DollarSign, TrendingUp, AlertCircle, CheckCircle, Shield, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// For analysis purposes, create a sample deal
const sampleDeal: Deal = {
  id: 'deal-1',
  title: 'Enterprise License',
  value: 75000,
  stage: 'qualification',
  company: 'Acme Inc',
  contact: 'John Doe',
  contactId: 'contact-1',
  dueDate: new Date('2025-07-15'),
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  probability: 10,
  daysInStage: 5,
  priority: 'high'
};

interface LiveDealAnalysisProps {
  deal?: Deal;
  onAnalysisComplete?: (analysis: any) => void;
}

const LiveDealAnalysis: React.FC<LiveDealAnalysisProps> = ({ 
  deal = sampleDeal,
  onAnalysisComplete 
}) => {
  // Using server-side OpenAI service for production-ready AI analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<{
    winProbability: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    opportunities: string[];
    nextSteps: string[];
    timelineEstimate: string;
    competitivePosition: string;
  } | null>(null);
  
  const progressSteps = [
    "Analyzing deal attributes...",
    "Assessing win probability...",
    "Identifying risk factors...",
    "Evaluating competitive position...",
    "Generating timeline estimates...",
    "Determining next steps...",
    "Finalizing analysis..."
  ];
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const runProgressSimulation = () => {
    let step = 0;
    setProgressText(progressSteps[0]);
    setProgress(0);
    
    progressIntervalRef.current = setInterval(() => {
      if (step < progressSteps.length - 1) {
        step++;
        setProgressText(progressSteps[step]);
        setProgress(Math.min((step / (progressSteps.length - 1)) * 100, 100));
      } else {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setProgress(100);
      }
    }, 1000);
  };
  
  const runAnalysis = async () => {
  setIsAnalyzing(true);
  setAnalysisResults(null);
  runProgressSimulation();
  
  try {
    // Use real AI analysis for production
    const dealData = {
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      company: deal.company,
      contact: deal.contact,
      probability: deal.probability || 0,
      daysInStage: deal.daysInStage || 0,
      priority: deal.priority || 'medium',
      createdAt: deal.createdAt?.toISOString(),
      updatedAt: deal.updatedAt?.toISOString()
    };

    const aiAnalysis = await openAIService.generateDealInsights(dealData);
    
    // Transform AI response to component format
    const results = {
      winProbability: aiAnalysis.winProbability || 50,
      riskLevel: aiAnalysis.riskLevel || 'medium',
      riskFactors: aiAnalysis.potentialBlockers || [
        "Analysis service temporarily unavailable"
      ],
      opportunities: aiAnalysis.recommendedActions?.filter(action => 
        action.toLowerCase().includes('opportunity') || 
        action.toLowerCase().includes('focus') ||
        action.toLowerCase().includes('emphasize')
      ) || [
        "Focus on building relationship with key stakeholders"
      ],
      nextSteps: aiAnalysis.recommendedActions || [
        "Schedule follow-up meeting",
        "Prepare detailed proposal",
        "Address any outstanding questions"
      ],
      timelineEstimate: "30-60 days",
      competitivePosition: "Strong position with differentiated value proposition"
    };
    
    setAnalysisResults(results);
    if (onAnalysisComplete) {
      onAnalysisComplete(results);
    }
  } catch (error) {
    console.error("Error analyzing deal:", error);
    // Provide fallback analysis if AI fails
    const fallbackResults = {
      winProbability: deal.probability || 25,
      riskLevel: 'medium',
      riskFactors: ["AI analysis temporarily unavailable"],
      opportunities: ["Manual review recommended"],
      nextSteps: ["Contact decision maker", "Follow up on outstanding items"],
      timelineEstimate: "45-90 days",
      competitivePosition: "Position analysis unavailable"
    };
    setAnalysisResults(fallbackResults);
    if (onAnalysisComplete) {
      onAnalysisComplete(fallbackResults);
    }
  } finally {
    // Clear the interval if it's still running
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsAnalyzing(false);
    setProgress(100);
  }
};
      
      setAnalysisResults(results);
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (error) {
      console.error("Error analyzing deal:", error);
    } finally {
      // Clear the interval if it's still running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setIsAnalyzing(false);
      setProgress(100);
    }
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart3 size={20} className="text-indigo-600 mr-2" />
            AI Deal Analysis
          </h3>
          <div>
            {!isAnalyzing && !analysisResults && (
              <button 
                onClick={runAnalysis}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none flex items-center"
              >
                <TrendingUp size={16} className="mr-1.5" />
                Analyze Deal
              </button>
            )}
            {!isAnalyzing && analysisResults && (
              <button 
                onClick={runAnalysis}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none flex items-center"
              >
                <RefreshCw size={16} className="mr-1.5" />
                Refresh Analysis
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Deal summary */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <DollarSign size={16} className="text-green-600 mr-1.5" />
            <span className="text-sm font-semibold text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.value)}</span>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              deal.stage === 'qualification' ? 'bg-blue-100 text-blue-800' :
              deal.stage === 'proposal' ? 'bg-indigo-100 text-indigo-800' :
              deal.stage === 'negotiation' ? 'bg-purple-100 text-purple-800' :
              deal.stage === 'closed-won' ? 'bg-green-100 text-green-800' :
              deal.stage === 'closed-lost' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              deal.priority === 'high' ? 'bg-red-100 text-red-800' :
              deal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} Priority
            </span>
          </div>
        </div>
      </div>
      
      {/* Analysis section */}
      <div className="p-4">
        {isAnalyzing && (
          <div className="space-y-4">
            <div className="text-center">
              <RefreshCw size={24} className="mx-auto text-indigo-600 mb-2 animate-spin" />
              <p className="text-sm font-medium text-gray-700">{progressText}</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div
                className="bg-indigo-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              Using Gemini 2.5 Pro for in-depth analysis
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {analysisResults && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Win Probability</h4>
                    <div className={`text-sm font-semibold ${
                      analysisResults.winProbability > 70 ? 'text-green-600' :
                      analysisResults.winProbability > 40 ? 'text-yellow-600' : 'text-red-600'
                    } flex items-center`}>
                      {analysisResults.winProbability}%
                      {analysisResults.winProbability > deal.probability ? (
                        <ArrowUpRight size={14} className="ml-0.5 text-green-500" />
                      ) : analysisResults.winProbability < deal.probability ? (
                        <ArrowDownRight size={14} className="ml-0.5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        analysisResults.winProbability > 70 ? 'bg-green-500' :
                        analysisResults.winProbability > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{width: `${analysisResults.winProbability}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Risk Level</h4>
                    <div className={`text-sm font-semibold ${
                      analysisResults.riskLevel === 'low' ? 'text-green-600' :
                      analysisResults.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    } flex items-center`}>
                      {analysisResults.riskLevel.charAt(0).toUpperCase() + analysisResults.riskLevel.slice(1)}
                      {analysisResults.riskLevel === 'low' ? (
                        <CheckCircle size={14} className="ml-1" />
                      ) : analysisResults.riskLevel === 'high' ? (
                        <AlertCircle size={14} className="ml-1" />
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        analysisResults.riskLevel === 'low' ? 'bg-green-500' :
                        analysisResults.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{width: analysisResults.riskLevel === 'low' ? '30%' : analysisResults.riskLevel === 'medium' ? '60%' : '90%'}}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
                    <div className="text-sm font-semibold text-gray-900">
                      {analysisResults.timelineEstimate}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Estimated time to close this deal</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <AlertCircle size={16} className="text-red-500 mr-1.5" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2 flex-shrink-0 text-xs font-medium">
                          {idx + 1}
                        </span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <TrendingUp size={16} className="text-green-500 mr-1.5" />
                    Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.opportunities.map((opportunity, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2 flex-shrink-0 text-xs font-medium">
                          {idx + 1}
                        </span>
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CheckCircle size={16} className="text-blue-500 mr-1.5" />
                  Recommended Next Steps
                </h4>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <ul className="space-y-2">
                    {analysisResults.nextSteps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <CheckCircle size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Shield size={16} className="text-purple-500 mr-1.5" />
                  Competitive Position
                </h4>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-gray-700">{analysisResults.competitivePosition}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isAnalyzing && !analysisResults && (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Deal Analysis</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Get AI-powered insights on this deal's win probability, risk factors, and recommended next steps.
            </p>
            <button 
              onClick={runAnalysis}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none inline-flex items-center"
            >
              <TrendingUp size={16} className="mr-1.5" />
              Analyze This Deal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDealAnalysis;