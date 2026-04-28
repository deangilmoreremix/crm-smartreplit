import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, TrendingUp, ExternalLink, Zap } from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import ModuleFederationPipeline from '../components/ModuleFederationPipeline';
import GTMIntegration from '../components/GTMIntegration';

const PipelinePage: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const [activeTab, setActiveTab] = useState('pipeline');

  const tabs = [
    { id: 'pipeline', label: 'Pipeline', icon: '📊' },
    { id: 'analytics', label: 'AI Analytics', icon: '🤖' },
  ];

  // Module Federation approach - no complex bridge logic needed
  // Data sync happens through the ModuleFederationPipeline component

  return (
    <div className="fixed inset-0 w-full overflow-hidden z-40">
      {/* Tab Navigation */}
      <div
        className={`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} px-6 py-3`}
      >
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="h-full overflow-hidden">
        {activeTab === 'pipeline' && (
          <div className="h-full w-full">
            <ModuleFederationPipeline showHeader={false} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Deal AI Analytics & Insights
                </h2>
                <p className="text-gray-600">
                  AI-powered recommendations and analytics for your sales pipeline. Get intelligent
                  insights to accelerate deal progression and improve win rates.
                </p>
              </div>

              <GTMIntegration dealId={undefined} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelinePage;
