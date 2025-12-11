import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Brain, Zap, Settings, BarChart3 } from 'lucide-react';
import { useAITools } from '../../components/AIToolsProvider';
import AIInsightsPanel from '../dashboard/AIInsightsPanel';
import { SmartAIControls } from '../ai/SmartAIControls';
import AIModelUsageStats from '../AIModelUsageStats';
import LiveDealAnalysis from '../aiTools/LiveDealAnalysis';
import SmartSearchRealtime from '../aiTools/SmartSearchRealtime';

const AISmartFeaturesHub: React.FC = () => {
  const { isDark } = useTheme();
  const { openTool } = useAITools();
  const [activeTab, setActiveTab] = useState<'insights' | 'controls' | 'performance' | 'tools'>('insights');

  // Tab configuration
  const tabs = [
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'controls', label: 'AI Controls', icon: Settings },
    { id: 'performance', label: 'AI Performance', icon: BarChart3 },
    { id: 'tools', label: 'AI Tools', icon: Zap }
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl mr-3">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Smart Features Hub</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            AI-powered insights and productivity tools
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 ${
                isActive 
                  ? (isDark ? 'border-b-2 border-purple-500 text-purple-400' : 'border-b-2 border-purple-600 text-purple-600')
                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'insights' && <AIInsightsPanel />}
        
        {activeTab === 'controls' && (
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} backdrop-blur-xl border rounded-2xl p-6`}>
            <SmartAIControls />
          </div>
        )}
        
        {activeTab === 'performance' && (
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} backdrop-blur-xl border rounded-2xl p-6`}>
            <AIModelUsageStats />
          </div>
        )}
        
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} backdrop-blur-xl border rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Zap size={18} className="text-purple-600 mr-2" />
                  <button 
                    onClick={() => openTool('live-deal-analysis')} 
                    className="text-inherit hover:underline focus:outline-none"
                  >
                    Live Deal Analysis
                  </button>
                </h3>
                <button 
                  onClick={() => openTool('live-deal-analysis')}
                  className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  Open Tool
                </button>
              </div>
              <div className="p-4">
                <LiveDealAnalysis />
              </div>
            </div>
            
            <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} backdrop-blur-xl border rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Search size={18} className="text-blue-600 mr-2" />
                  <button 
                    onClick={() => openTool('semantic-search')} 
                    className="text-inherit hover:underline focus:outline-none"
                  >
                    Smart Search
                  </button>
                </h3>
                <button 
                  onClick={() => openTool('semantic-search')}
                  className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Open Tool
                </button>
              </div>
              <SmartSearchRealtime />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { Search } from 'lucide-react';
export default AISmartFeaturesHub;