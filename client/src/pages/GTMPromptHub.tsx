import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardData {
  overview: {
    totalPrompts: number;
    totalResponses: number;
    avgPerformanceScore: number;
    avgQualityScore: number;
    totalTokens: number;
    totalCost: number;
    totalRevenue: number;
  };
  recentActivity: {
    promptsLast7Days: number;
    responsesLast7Days: number;
    scoreTrend: number;
  };
  recentData: {
    performance: Array<{
      performance_score: number;
      tokens_used: number;
      cost: number;
      created_at: string;
    }>;
    responses: Array<{
      quality_score: number;
      revenue_attributed: number;
      created_at: string;
    }>;
  };
}

interface PerformanceData {
  performance: {
    timeRange: string;
    summary: {
      totalPrompts: number;
      avgPerformanceScore: number;
      totalTokens: number;
      totalCost: number;
      totalResponses: number;
      avgQualityScore: number;
      totalRevenue: number;
    };
    trends: {
      daily: Array<{
        date: string;
        prompts: number;
        avgScore: number;
        totalTokens: number;
        totalCost: number;
        responses: number;
        avgQuality: number;
        totalRevenue: number;
      }>;
      categories: Array<{
        category: string;
        count: number;
        avgScore: number;
        totalTokens: number;
        totalCost: number;
      }>;
    };
  };
}

interface ABTest {
  id: string;
  name: string;
  description: string | null;
  prompt_a: string;
  prompt_b: string;
  category: string | null;
  status: string;
  winner: string | null;
  a_responses: number;
  b_responses: number;
  a_score: number | null;
  b_score: number | null;
  created_at: string;
}

const GTMPromptHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'ab-tests'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({ name: '', description: '', promptA: '', promptB: '', category: '' });

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'dashboard' })
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      setDashboardData(data.dashboard);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard');
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'performance', timeRange })
      });

      if (!response.ok) throw new Error('Failed to fetch performance');
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      console.error('Performance error:', err);
    }
  }, [timeRange]);

  const fetchABTests = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'get_ab_tests' })
      });

      if (!response.ok) throw new Error('Failed to fetch A/B tests');
      const data = await response.json();
      setAbTests(data.ab_tests || []);
    } catch (err) {
      console.error('AB tests error:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchABTests()]);
      setLoading(false);
    };
    loadData();
  }, [fetchDashboard, fetchABTests]);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, fetchPerformance]);

  const handleCreateABTest = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'create_ab_test',
          name: newTest.name,
          description: newTest.description,
          promptA: newTest.promptA,
          promptB: newTest.promptB,
          category: newTest.category || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to create A/B test');
      setShowCreateModal(false);
      setNewTest({ name: '', description: '', promptA: '', promptB: '', category: '' });
      fetchABTests();
    } catch (err) {
      console.error('Create AB test error:', err);
      setError('Failed to create A/B test');
    }
  };

  const handleTrackResponse = async (promptId: string, responseText: string, qualityScore: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'track_response',
          promptId,
          responseText,
          qualityScore,
          category: 'gtm_hub'
        })
      });

      fetchDashboard();
    } catch (err) {
      console.error('Track response error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">GTM Prompt Library</h1>
        <p className="mt-2 text-gray-600">
          Analytics and optimization for your AI prompt performance.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('ab-tests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ab-tests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            A/B Tests
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Total Prompts</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboardData.overview.totalPrompts}</p>
              <p className="mt-1 text-sm text-gray-500">
                {dashboardData.recentActivity.promptsLast7Days} in last 7 days
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Avg Performance</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {dashboardData.overview.avgPerformanceScore.toFixed(1)}%
              </p>
              <p className={`mt-1 text-sm ${dashboardData.recentActivity.scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.recentActivity.scoreTrend >= 0 ? '+' : ''}{dashboardData.recentActivity.scoreTrend.toFixed(1)}% trend
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                ${dashboardData.overview.totalRevenue.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                From {dashboardData.overview.totalResponses} responses
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Avg Quality</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {dashboardData.overview.avgQualityScore.toFixed(1)}%
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Cost: ${dashboardData.overview.totalCost.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              {dashboardData.recentData.performance.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentData.performance.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">
                          Score: {item.performance_score?.toFixed(1) || 'N/A'}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.tokens_used?.toLocaleString() || 0} tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">${item.cost?.toFixed(4) || '0.00'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tokens Used</span>
                  <span className="font-medium">{dashboardData.overview.totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Responses</span>
                  <span className="font-medium">{dashboardData.overview.totalResponses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Cost per Prompt</span>
                  <span className="font-medium">
                    ${dashboardData.overview.totalPrompts > 0 
                      ? (dashboardData.overview.totalCost / dashboardData.overview.totalPrompts).toFixed(6)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue per Response</span>
                  <span className="font-medium">
                    ${dashboardData.overview.totalResponses > 0
                      ? (dashboardData.overview.totalRevenue / dashboardData.overview.totalResponses).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Responses</h3>
              {dashboardData.recentData.responses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No responses tracked</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentData.responses.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">Quality: {item.quality_score?.toFixed(1) || 'N/A'}%</p>
                        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        ${item.revenue_attributed?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {performanceData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-500">Prompts</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {performanceData.performance.summary.totalPrompts}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-500">Avg Score</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {performanceData.performance.summary.avgPerformanceScore.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    ${performanceData.performance.summary.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>

              {performanceData.performance.trends.daily.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Daily Trends</h3>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prompts</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {performanceData.performance.trends.daily.slice(-10).reverse().map((day, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-900">{day.date}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{day.prompts}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{day.avgScore?.toFixed(1) || 'N/A'}%</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{day.totalTokens?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">${day.totalCost?.toFixed(4) || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {performanceData.performance.trends.categories.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">By Category</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {performanceData.performance.trends.categories.map((cat, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{cat.category || 'Uncategorized'}</p>
                          <p className="text-sm text-gray-500 mt-1">{cat.count} prompts</p>
                          <p className="text-sm text-gray-600 mt-1">Avg: {cat.avgScore?.toFixed(1) || 'N/A'}%</p>
                          <p className="text-sm text-gray-500">Cost: ${cat.totalCost?.toFixed(4) || '0.00'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'ab-tests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">A/B Tests</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Test
            </button>
          </div>

          {abTests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No A/B tests yet. Create one to start optimizing your prompts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {abTests.map((test) => (
                <div key={test.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                        test.status === 'active' ? 'bg-green-100 text-green-800' :
                        test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    {test.winner && (
                      <span className="text-sm font-medium text-indigo-600">
                        Winner: {test.winner.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {test.description && (
                    <p className="mt-2 text-sm text-gray-500">{test.description}</p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Variant A</p>
                      <p className="text-lg font-semibold">{test.a_responses}</p>
                      <p className="text-xs text-gray-400">responses</p>
                      {test.a_score !== null && (
                        <p className="text-xs text-indigo-600 mt-1">Score: {(test.a_score * 100).toFixed(0)}%</p>
                      )}
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Variant B</p>
                      <p className="text-lg font-semibold">{test.b_responses}</p>
                      <p className="text-xs text-gray-400">responses</p>
                      {test.b_score !== null && (
                        <p className="text-xs text-indigo-600 mt-1">Score: {(test.b_score * 100).toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Created {new Date(test.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create A/B Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Test name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe what you're testing"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
                <input
                  type="text"
                  value={newTest.category}
                  onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., sales, support"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant A Prompt</label>
                <textarea
                  value={newTest.promptA}
                  onChange={(e) => setNewTest({ ...newTest, promptA: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter prompt variant A"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant B Prompt</label>
                <textarea
                  value={newTest.promptB}
                  onChange={(e) => setNewTest({ ...newTest, promptB: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter prompt variant B"
                  rows={4}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateABTest}
                disabled={!newTest.name || !newTest.promptA || !newTest.promptB}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GTMPromptHub;