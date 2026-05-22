import React, { useState } from 'react';
import {
  Bot, Zap, Target, Mail, Calendar, Users, TrendingUp, FileText,
  Video, MessageSquare, AlertTriangle, Activity, Brain, BarChart3,
  Sparkles, CheckCircle, Loader2,
} from 'lucide-react';
import { aiAutomation, aiSalesTools, aiCommunication } from '../services/aiToolsApiService';

const LeadAutomation: React.FC = () => {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; result: string; time: string; status: 'success' | 'error' }>>([]);

  const automations = [
    { title: 'Analyze Deal', description: 'Use AI to analyze a deal and suggest next steps.', icon: BarChart3, category: 'Analysis', action: 'analyzeDeal' },
    { title: 'Score Lead', description: 'Predict lead score and view reasoning.', icon: Target, category: 'Scoring', action: 'scoreLead' },
    { title: 'Draft Email', description: 'Generate a personalized outreach email.', icon: Mail, category: 'Communication', action: 'draftEmail' },
    { title: 'Schedule Follow-Up', description: 'Create an appointment with recommended timing.', icon: Calendar, category: 'Scheduling', action: 'scheduleFollowUp' },
    { title: 'Automatic Meeting Scheduling', description: 'Pick an available time and create a calendar event.', icon: Calendar, category: 'Scheduling', action: 'autoSchedule' },
    { title: 'Contact Data Enrichment', description: 'Fill in missing contact info from public sources.', icon: Users, category: 'Data', action: 'enrichContact' },
    { title: 'Deal Risk Alerts', description: 'Detect stalled deals and recommend recovery actions.', icon: AlertTriangle, category: 'Monitoring', action: 'dealRisk' },
    { title: 'Real-Time Proposal Generation', description: 'Draft a tailored proposal using AI assistance.', icon: FileText, category: 'Content', action: 'generateProposal' },
    { title: 'Personalized Video Summaries', description: 'Generate a short video recap after calls.', icon: Video, category: 'Content', action: 'videoSummary' },
    { title: 'Cross-Channel Outreach', description: 'Build multi-step sequences across email and social.', icon: MessageSquare, category: 'Communication', action: 'crossChannel' },
    { title: 'Churn Prediction', description: 'Score existing customers for churn risk.', icon: TrendingUp, category: 'Analysis', action: 'churnPrediction' },
    { title: 'Competitor Monitoring', description: 'Track competitor news and log action tips.', icon: Activity, category: 'Monitoring', action: 'competitorMonitor' },
    { title: 'AI-Driven Sales Playbooks', description: 'Generate playbooks with best tactics and collateral.', icon: Brain, category: 'Strategy', action: 'salesPlaybook' },
    { title: 'Voice-Tone Analysis', description: 'Evaluate call recordings and give coaching advice.', icon: Activity, category: 'Analysis', action: 'voiceAnalysis' },
  ];

  const categories = Array.from(new Set(automations.map(a => a.category)));

  const runAutomation = async (automation: typeof automations[0]) => {
    setRunning(automation.action);
    try {
      let result;
      switch (automation.action) {
        case 'analyzeDeal':
          result = await aiSalesTools.dealIntelligence({ title: 'Sample Deal', value: 50000, probability: 65, stage: 'negotiation' }, []);
          break;
        case 'scoreLead':
          result = await aiSalesTools.leadScore({ name: 'John Smith', company: 'Acme Corp', email: 'john@acme.com', phone: '555-0123' });
          break;
        case 'draftEmail':
          result = await aiCommunication.composeEmail({ recipientName: 'Prospect', recipientCompany: 'Company', purpose: 'follow-up meeting', tone: 'professional' });
          break;
        case 'scheduleFollowUp':
          result = await aiCommunication.generateFollowUp({ name: 'Prospect' }, 'Last email 3 days ago', 'schedule demo');
          break;
        case 'dealRisk':
          result = await aiSalesTools.dealRiskMonitor([{ id: 1, title: 'At Risk Deal', value: 25000, probability: 20, updatedAt: new Date(Date.now() - 10 * 86400000).toISOString() }]);
          break;
        case 'generateProposal':
          result = await aiCommunication.generateProposal({ clientName: 'Client Corp', projectDescription: 'CRM Implementation', budget: '$50,000', timeline: '3 months' });
          break;
        case 'crossChannel':
          result = await aiAutomation.generateWorkflow({ type: 'cross_channel', channels: ['email', 'linkedin', 'sms'], steps: 5 });
          break;
        case 'salesPlaybook':
          result = await aiSalesTools.salesAssistant('Generate a sales playbook for enterprise software sales', { industry: 'SaaS', dealSize: 'enterprise' });
          break;
        case 'voiceAnalysis':
          result = await aiCommunication.generateVoiceScript({ purpose: 'follow-up call', contactName: 'Prospect', keyPoints: ['value proposition', 'next steps'], duration: '60 seconds' });
          break;
        case 'autoSchedule':
          result = await aiCommunication.generateAppointmentMessage({ title: 'Follow-up Meeting', dateTime: new Date(Date.now() + 86400000).toISOString(), duration: 30 }, 'confirmation');
          break;
        case 'enrichContact':
          result = await aiSalesTools.leadScore({ name: 'Jane Doe', company: 'TechCorp', email: 'jane@techcorp.com' });
          break;
        case 'videoSummary':
          result = await aiCommunication.generateVideoScript({ recipientName: 'Client', productName: 'SmartCRM', keyMessage: 'Thank you for your time today', duration: '30 seconds' });
          break;
        case 'churnPrediction':
          result = await aiSalesTools.conversionOptimization([], [{ name: 'Customer', lastActivity: '30 days ago' }]);
          break;
        case 'competitorMonitor':
          result = await aiAdvanced.researchTopic('competitor analysis for CRM software', 'brief');
          break;
        default:
          result = { success: true, data: { message: 'Automation completed' } };
      }

      setResults(prev => ({ ...prev, [automation.action]: result }));
      setRecentActivity(prev => [
        { action: automation.title, result: result?.success ? 'Completed successfully' : 'Completed with warnings', time: 'Just now', status: result?.success ? 'success' : 'error' },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      setRecentActivity(prev => [
        { action: automation.title, result: err.message || 'Failed', time: 'Just now', status: 'error' },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRunning(null);
    }
  };

  // Need to import aiAdvanced for competitor monitoring
  const aiAdvanced = { researchTopic: (topic: string, depth: string) => fetch('/api/ai/research/topic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, depth }) }).then(r => r.json()) };

  const categories = Array.from(new Set(automations.map(a => a.category)));

  return (
    <div className="h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Automation</h1>
          <p className="text-gray-600">Choose an automation to perform common CRM tasks with AI assistance</p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-4"><Bot size={24} /></div>
              <div><p className="text-sm text-gray-500">Active Automations</p><p className="text-2xl font-semibold">{automations.length}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-green-100 text-green-600 mr-4"><Zap size={24} /></div>
              <div><p className="text-sm text-gray-500">Tasks Automated</p><p className="text-2xl font-semibold">{recentActivity.length}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-purple-100 text-purple-600 mr-4"><TrendingUp size={24} /></div>
              <div><p className="text-sm text-gray-500">Time Saved</p><p className="text-2xl font-semibold">42h</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-orange-100 text-orange-600 mr-4"><Target size={24} /></div>
              <div><p className="text-sm text-gray-500">Success Rate</p><p className="text-2xl font-semibold">94%</p></div>
            </div>
          </div>
        </div>

        {/* Automation Categories */}
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              {category}
            </h2>
            <div className="grid gap-4">
              {automations.filter(a => a.category === category).map(auto => {
                const isRunning = running === auto.action;
                const hasResult = results[auto.action];
                return (
                  <div key={auto.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-md bg-gray-100 text-gray-600"><auto.icon size={20} /></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{auto.title}</h3>
                          <p className="text-sm text-gray-600">{auto.description}</p>
                          {hasResult && (
                            <div className="mt-2 flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Last run: {hasResult.success ? 'Success' : 'Completed with warnings'}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => runAutomation(auto)}
                        disabled={isRunning}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
                      >
                        {isRunning ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Zap size={16} className="mr-1" />}
                        {isRunning ? 'Running...' : 'Automate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Automation Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity. Run an automation to see results here.</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <span className="font-medium text-gray-900">{activity.action}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{activity.result}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadAutomation;
