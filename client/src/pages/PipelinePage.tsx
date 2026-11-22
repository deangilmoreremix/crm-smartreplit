import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, TrendingUp, ExternalLink, Zap } from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import ModuleFederationPipeline from '../components/ModuleFederationPipeline';
import GTMIntegration from '../components/GTMIntegration';
import DealKanbanBoard from '../components/DealKanbanBoard';
import DealsTable from '../components/record-table/DealsTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PipelinePage: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link: /pipeline?new=1 (Command menu "Create Deal") opens the create-deal dialog.
  const showNewDeal = searchParams.get('new') === '1';
  const closeNewDeal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('stage');
    setSearchParams(next, { replace: true });
  };
  const stages = useDealStore((s) => s.pipelines[s.activePipelineId]?.stages ?? []);
  // /pipeline?new=1&stage=<id> (Kanban column "+") preselects that stage.
  const presetStageId = searchParams.get('stage') || '';
  const [form, setForm] = useState({ title: '', value: '', stageId: '' });
  const [saving, setSaving] = useState(false);
  const submitNewDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const stage = stages.find((s) => s.id === (form.stageId || presetStageId)) ?? stages[0];
    if (!form.title.trim() || !stage) return;
    setSaving(true);
    const id = await useDealStore.getState().addDeal({
      title: form.title.trim(),
      value: Number(form.value) || 0,
      stage,
      probability: stage.probability,
      contactId: '',
      priority: 'medium',
      source: 'other',
      tags: [],
      customFields: {},
      activities: [],
      attachments: [],
      currency: 'USD',
    });
    setSaving(false);
    if (id) {
      setForm({ title: '', value: '', stageId: '' });
      closeNewDeal();
    }
  };

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
      <Dialog open={showNewDeal} onOpenChange={(open) => !open && closeNewDeal()}>
        <DialogContent>
          <form onSubmit={submitNewDeal}>
            <DialogHeader>
              <DialogTitle>Create Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <label className="block text-sm font-medium">
                Title
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </label>
              <label className="block text-sm font-medium">
                Value (USD)
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Stage
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900"
                  value={form.stageId || presetStageId || stages[0]?.id || ''}
                  onChange={(e) => setForm({ ...form, stageId: e.target.value })}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <DialogFooter>
              <button type="button" onClick={closeNewDeal} className="px-4 py-2 text-sm rounded-md border">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create deal'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelinePage;
