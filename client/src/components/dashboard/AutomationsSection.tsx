import React, { useState } from 'react';
import { 
  Clock, 
  Repeat, 
  Mail, 
  Phone, 
  MessageSquare, 
  UserPlus, 
  Calendar, 
  Target,
  TrendingUp,
  Star,
  Users,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'wouter';

interface Automation {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  hoverColor: string;
  category: 'follow-up' | 'pipeline' | 'relationships' | 'time-savers';
}

const AutomationsSection = () => {
  const { isDark } = useTheme();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'follow-up' | 'pipeline' | 'relationships' | 'time-savers'>('follow-up');

  const automations: Automation[] = [
    // Follow-Up Automations
    {
      id: 'email-followup',
      title: 'Email Follow-Up',
      description: 'Auto send follow-ups after meetings',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
      category: 'follow-up'
    },
    {
      id: 'sms-reminder',
      title: 'SMS Reminders',
      description: 'Send appointment reminders via text',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
      category: 'follow-up'
    },
    {
      id: 'call-followup',
      title: 'Call Follow-Up',
      description: 'Schedule calls after no-shows',
      icon: Phone,
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-600 hover:to-emerald-600',
      category: 'follow-up'
    },
    {
      id: 'task-reminder',
      title: 'Task Reminders',
      description: 'Daily digest of pending tasks',
      icon: CheckCircle,
      color: 'from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
      category: 'follow-up'
    },

    // Pipeline Automations
    {
      id: 'deal-stage-move',
      title: 'Auto Move Deals',
      description: 'Move deals based on activity',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-600',
      category: 'pipeline'
    },
    {
      id: 'lead-scoring',
      title: 'Lead Scoring',
      description: 'Auto-score leads by engagement',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      hoverColor: 'hover:from-yellow-600 hover:to-orange-600',
      category: 'pipeline'
    },
    {
      id: 'stale-deal-alert',
      title: 'Stale Deal Alerts',
      description: 'Alert on inactive deals',
      icon: AlertCircle,
      color: 'from-red-500 to-pink-500',
      hoverColor: 'hover:from-red-600 hover:to-pink-600',
      category: 'pipeline'
    },
    {
      id: 'win-probability',
      title: 'Win Probability',
      description: 'Auto-calculate deal win rates',
      icon: Target,
      color: 'from-teal-500 to-cyan-500',
      hoverColor: 'hover:from-teal-600 hover:to-cyan-600',
      category: 'pipeline'
    },

    // Relationship Automations
    {
      id: 'birthday-greeting',
      title: 'Birthday Greetings',
      description: 'Send birthday wishes automatically',
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      hoverColor: 'hover:from-pink-600 hover:to-rose-600',
      category: 'relationships'
    },
    {
      id: 'milestone-celebration',
      title: 'Milestone Alerts',
      description: 'Celebrate client anniversaries',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      hoverColor: 'hover:from-violet-600 hover:to-purple-600',
      category: 'relationships'
    },
    {
      id: 'referral-request',
      title: 'Referral Requests',
      description: 'Ask happy clients for referrals',
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-600',
      category: 'relationships'
    },
    {
      id: 'check-in-sequence',
      title: 'Check-In Sequence',
      description: 'Regular touchpoints with clients',
      icon: UserPlus,
      color: 'from-green-500 to-teal-500',
      hoverColor: 'hover:from-green-600 hover:to-teal-600',
      category: 'relationships'
    },

    // Time-Savers Automations
    {
      id: 'meeting-notes',
      title: 'Meeting Notes',
      description: 'Auto-generate meeting summaries',
      icon: FileText,
      color: 'from-cyan-500 to-blue-500',
      hoverColor: 'hover:from-cyan-600 hover:to-blue-600',
      category: 'time-savers'
    },
    {
      id: 'daily-brief',
      title: 'Daily Brief',
      description: 'Morning summary of your day',
      icon: Bell,
      color: 'from-amber-500 to-orange-500',
      hoverColor: 'hover:from-amber-600 hover:to-orange-600',
      category: 'time-savers'
    },
    {
      id: 'data-entry',
      title: 'Smart Data Entry',
      description: 'Auto-populate contact info',
      icon: Repeat,
      color: 'from-emerald-500 to-green-500',
      hoverColor: 'hover:from-emerald-600 hover:to-green-600',
      category: 'time-savers'
    },
    {
      id: 'task-auto-create',
      title: 'Auto-Create Tasks',
      description: 'Generate tasks from emails',
      icon: Clock,
      color: 'from-rose-500 to-red-500',
      hoverColor: 'hover:from-rose-600 hover:to-red-600',
      category: 'time-savers'
    }
  ];

  const filteredAutomations = automations.filter(auto => auto.category === activeTab);

  const tabs = [
    { id: 'follow-up' as const, label: 'Follow-Up', count: automations.filter(a => a.category === 'follow-up').length },
    { id: 'pipeline' as const, label: 'Pipeline', count: automations.filter(a => a.category === 'pipeline').length },
    { id: 'relationships' as const, label: 'Relationships', count: automations.filter(a => a.category === 'relationships').length },
    { id: 'time-savers' as const, label: 'Time-Savers', count: automations.filter(a => a.category === 'time-savers').length }
  ];

  const handleAutomationClick = (automationId: string) => {
    console.log('Automation clicked:', automationId);
    // Navigate to automation configuration page
    setLocation(`/automations/${automationId}`);
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 mb-8`} data-testid="section-automations">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} data-testid="heading-automations">
          Automations
        </h2>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} data-testid="text-tagline">
          Set it and forget it
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid={`automation-tab-${tab.id}`}
          >
            {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Automation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAutomations.map((automation, index) => (
          <button
            key={automation.id}
            onClick={() => handleAutomationClick(automation.id)}
            className={`bg-gradient-to-r ${automation.color} ${automation.hoverColor} rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer`}
            data-testid={`automation-${automation.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl">
                <automation.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-white text-base" data-testid={`text-title-${automation.id}`}>{automation.title}</h3>
              <p className="text-white/80 text-sm mt-1" data-testid={`text-description-${automation.id}`}>{automation.description}</p>
            </div>
            <div className="mt-4 flex items-center text-white/60 text-xs">
              <Repeat className="h-3 w-3 mr-1" />
              <span data-testid={`text-status-${automation.id}`}>Not configured</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AutomationsSection;
