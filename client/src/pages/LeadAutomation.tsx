import React from 'react';
import { Bot, Zap, Target, Mail, Calendar, Users, TrendingUp, FileText, Video, MessageSquare, AlertTriangle, Activity, Brain, BarChart3 } from 'lucide-react';

const LeadAutomation: React.FC = () => {
  const automations = [
    {
      title: 'Analyze Deal',
      description: 'Use AI to analyze a deal and suggest next steps.',
      icon: BarChart3,
      category: 'Analysis'
    },
    {
      title: 'Score Lead',
      description: 'Predict lead score and view reasoning.',
      icon: Target,
      category: 'Scoring'
    },
    {
      title: 'Draft Email',
      description: 'Generate a personalized outreach email.',
      icon: Mail,
      category: 'Communication'
    },
    {
      title: 'Schedule Follow-Up',
      description: 'Create an appointment with recommended timing.',
      icon: Calendar,
      category: 'Scheduling'
    },
    {
      title: 'Automatic Meeting Scheduling',
      description: 'Pick an available time and create a calendar event.',
      icon: Calendar,
      category: 'Scheduling'
    },
    {
      title: 'Contact Data Enrichment',
      description: 'Fill in missing contact info from public sources.',
      icon: Users,
      category: 'Data'
    },
    {
      title: 'Deal Risk Alerts',
      description: 'Detect stalled deals and recommend recovery actions.',
      icon: AlertTriangle,
      category: 'Monitoring'
    },
    {
      title: 'Real-Time Proposal Generation',
      description: 'Draft a tailored proposal using AI assistance.',
      icon: FileText,
      category: 'Content'
    },
    {
      title: 'Personalized Video Summaries',
      description: 'Generate a short video recap after calls.',
      icon: Video,
      category: 'Content'
    },
    {
      title: 'Cross-Channel Outreach',
      description: 'Build multi-step sequences across email and social.',
      icon: MessageSquare,
      category: 'Communication'
    },
    {
      title: 'Churn Prediction',
      description: 'Score existing customers for churn risk.',
      icon: TrendingUp,
      category: 'Analysis'
    },
    {
      title: 'Competitor Monitoring',
      description: 'Track competitor news and log action tips.',
      icon: Activity,
      category: 'Monitoring'
    },
    {
      title: 'AI-Driven Sales Playbooks',
      description: 'Generate playbooks with best tactics and collateral.',
      icon: Brain,
      category: 'Strategy'
    },
    {
      title: 'Voice-Tone Analysis',
      description: 'Evaluate call recordings and give coaching advice.',
      icon: Activity,
      category: 'Analysis'
    }
  ];

  const categories = Array.from(new Set(automations.map(auto => auto.category)));

  const AutomateButton = ({ className = '' }: { className?: string }) => (
    <button 
      className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors ${className}`}
      onClick={() => {
        // In a real app, this would trigger the automation
        alert('Automation triggered! This would start the AI process.');
      }}
    >
      <Zap size={16} className="mr-1" />
      Automate
    </button>
  );

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
            <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-4">
              <Bot size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Automations</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-green-100 text-green-600 mr-4">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks Automated</p>
              <p className="text-2xl font-semibold">847</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-purple-100 text-purple-600 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Saved</p>
              <p className="text-2xl font-semibold">42h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-orange-100 text-orange-600 mr-4">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold">94%</p>
            </div>
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
            {automations
              .filter(auto => auto.category === category)
              .map((auto) => (
                <div key={auto.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-md bg-gray-100 text-gray-600">
                        <auto.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{auto.title}</h3>
                        <p className="text-sm text-gray-600">{auto.description}</p>
                      </div>
                    </div>
                    <AutomateButton />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Automation Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'Lead Scored', contact: 'John Smith', result: '85/100', time: '2 minutes ago' },
            { action: 'Email Drafted', contact: 'Sarah Johnson', result: 'Follow-up sent', time: '5 minutes ago' },
            { action: 'Deal Analyzed', contact: 'Mike Chen', result: 'High risk detected', time: '12 minutes ago' },
            { action: 'Meeting Scheduled', contact: 'Emily Davis', result: 'Tuesday 2pm', time: '18 minutes ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <span className="font-medium text-gray-900">{activity.action}</span>
                  <span className="text-gray-600"> for {activity.contact}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{activity.result}</div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default LeadAutomation;