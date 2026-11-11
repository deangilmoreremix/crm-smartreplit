import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, TrendingUp, ExternalLink, Zap } from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import ModuleFederationPipeline from '../components/ModuleFederationPipeline';
import GTMIntegration from '../components/GTMIntegration';
import DealKanbanBoard from '../components/DealKanbanBoard';
import DealsTable from '../components/record-table/DealsTable';

const PipelinePage: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Pick up deals changed elsewhere when the user returns to this tab (at most once per 30s).
  const lastFetchRef = useRef(Date.now()); // the board fetches on mount
  useEffect(() => {
    const refetch = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastFetchRef.current < 30_000) return;
      lastFetchRef.current = Date.now();
      void useDealStore.getState().fetchDeals();
    };
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', refetch);
    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', refetch);
    };
  }, []);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [dealView, setDealView] = useState<'kanban' | 'table' | 'list'>('kanban');

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
          <div className="h-full w-full flex flex-col">
            <div className="flex justify-end px-6 py-2" role="tablist" aria-label="Deal view">
              {(['kanban', 'table', 'list'] as const).map((view) => (
                <button
                  key={view}
                  role="tab"
                  aria-selected={dealView === view}
                  onClick={() => setDealView(view)}
                  className={`px-3 py-1 text-sm font-medium border first:rounded-l-md last:rounded-r-md ${
                    dealView === view
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {view === 'kanban' ? 'Kanban' : view === 'table' ? 'Table' : 'List'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {dealView === 'kanban' ? (
                <DealKanbanBoard />
              ) : dealView === 'table' ? (
                <DealsTable />
              ) : (
                <ModuleFederationPipeline showHeader={false} />
              )}
            </div>
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
