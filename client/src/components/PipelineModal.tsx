import React, { useState } from 'react';
import { useDealStore } from '../store/dealStore';
import { X, ArrowRight, BarChart3, DollarSign } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PipelineModal: React.FC<PipelineModalProps> = ({ isOpen, onClose }) => {
  const { deals, stageValues, totalPipelineValue } = useDealStore();
  const { isDark } = useTheme();
  const [activeView, setActiveView] = useState<'pipeline' | 'analysis'>('pipeline');

  if (!isOpen) return null;
  
  const stages = [
    { id: 'qualification', name: 'Qualification', color: 'bg-blue-500' },
    { id: 'proposal', name: 'Proposal', color: 'bg-purple-500' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' }
  ];
  
  // Group deals by stage
  const dealsByStage: Record<string, typeof deals> = {};
  stages.forEach(stage => {
    dealsByStage[stage.id] = {};
  });
  
  Object.values(deals).forEach(deal => {
    if (dealsByStage[deal.stage]) {
      dealsByStage[deal.stage][deal.id] = deal;
    }
  });
  
  // Calculate stage metrics
  const stageMetrics = stages.map(stage => {
    const stageDeals = Object.values(dealsByStage[stage.id] || {});
    const value = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
    const count = stageDeals.length;
    const percentage = totalPipelineValue > 0 && stage.id !== 'closed-won' && stage.id !== 'closed-lost' 
      ? (value / totalPipelineValue) * 100 
      : 0;
      
    return { ...stage, value, count, percentage };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <div className={`relative w-full max-w-4xl mx-auto ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl transition-all duration-300 transform`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <BarChart3 className={`h-6 w-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Dashboard</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.keys(deals).length} Deals • {formatCurrency(totalPipelineValue)}
              </p>
            </div>
          </div>
          
          {/* View Switcher */}
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setActiveView('pipeline')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeView === 'pipeline' 
                    ? isDark 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-green-100 text-green-600' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setActiveView('analysis')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeView === 'analysis' 
                    ? isDark 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-blue-100 text-blue-600' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Analysis
              </button>
            </div>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {activeView === 'pipeline' ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Value</h3>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalPipelineValue)}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{Object.keys(deals).length} total deals</p>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Avg Deal Size</h3>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totalPipelineValue / Math.max(1, Object.keys(deals).length))}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Based on active deals</p>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowRight className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Deal Velocity</h3>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>28 days</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Average time to close</p>
                </div>
              </div>
              
              {/* Pipeline Visualization */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Stages</h3>
                <div className="space-y-4">
                  {stageMetrics.map((stage) => (
                    <div key={stage.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stage.count} deals</span>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stage.value)}</span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      {stage.id !== 'closed-won' && stage.id !== 'closed-lost' && (
                        <div className={`w-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                            style={{ width: `${stage.percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                  onClick={onClose}
                >
                  Close
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  onClick={() => window.location.href = '/pipeline'}
                >
                  Full Pipeline View
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analysis Content (placeholder) */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Analysis</h3>
                <div className="space-y-4">
                  {/* Visualization Placeholder */}
                  <div className={`w-full h-60 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pipeline analysis visualization</p>
                  </div>
                  
                  {/* Analytics Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Conversion Rates</h4>
                      <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li className="flex justify-between">
                          <span>Qualification → Proposal</span>
                          <span className="font-medium">64%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Proposal → Negotiation</span>
                          <span className="font-medium">58%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Negotiation → Closed</span>
                          <span className="font-medium">72%</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Insights</h4>
                      <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li className="flex items-start space-x-2">
                          <span>•</span>
                          <span>3 deals stalled in negotiation stage</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span>•</span>
                          <span>2 high-value opportunities need attention</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span>•</span>
                          <span>Pipeline velocity increased by 15% this month</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                  onClick={onClose}
                >
                  Close
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  onClick={() => window.location.href = '/analytics'}
                >
                  Full Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default PipelineModal;