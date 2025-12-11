import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Phone, 
  Mail, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

const DashboardDemo: React.FC = () => {
  const [animateKPIs, setAnimateKPIs] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    const timer = setTimeout(() => setAnimateKPIs(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const kpiData = {
    '7d': {
      revenue: 24750,
      deals: 8,
      contacts: 342,
      winRate: 67
    },
    '30d': {
      revenue: 127500,
      deals: 24,
      contacts: 1248,
      winRate: 85
    },
    '90d': {
      revenue: 345000,
      deals: 67,
      contacts: 3240,
      winRate: 78
    }
  };

  const currentData = kpiData[selectedTimeframe as keyof typeof kpiData];

  const recentActivities = [
    {
      id: 1,
      type: 'deal_won',
      title: 'Acme Corp deal closed',
      value: '$15,000',
      time: '2 hours ago',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    {
      id: 2,
      type: 'meeting',
      title: 'Demo call with TechStart Inc',
      value: 'High priority',
      time: '4 hours ago',
      icon: <Calendar className="w-5 h-5 text-blue-500" />
    },
    {
      id: 3,
      type: 'email',
      title: 'Follow-up sent to 12 prospects',
      value: 'Campaign complete',
      time: '6 hours ago',
      icon: <Mail className="w-5 h-5 text-purple-500" />
    },
    {
      id: 4,
      type: 'contact_added',
      title: 'New lead from website form',
      value: 'Sarah Johnson',
      time: '8 hours ago',
      icon: <Users className="w-5 h-5 text-orange-500" />
    }
  ];

  const upcomingTasks = [
    { id: 1, task: 'Follow up with Acme Corp on contract terms', due: 'Today 2:00 PM', priority: 'high' },
    { id: 2, task: 'Prepare demo for Global Solutions meeting', due: 'Tomorrow 10:00 AM', priority: 'medium' },
    { id: 3, task: 'Send proposal to TechStart Inc', due: 'Friday 9:00 AM', priority: 'high' },
    { id: 4, task: 'Update CRM data for Q1 leads', due: 'Next week', priority: 'low' }
  ];

  const AnimatedKPI = ({ 
    icon, 
    title, 
    value, 
    change, 
    isPositive, 
    delay = 0 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change: string;
    isPositive: boolean;
    delay?: number;
  }) => (
    <div 
      className={`bg-white rounded-lg p-6 shadow-lg border transition-all duration-700 hover:shadow-xl cursor-pointer ${
        animateKPIs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {isPositive ? (
          <ArrowUp className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">vs last period</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Demo Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Demo</h1>
            <p className="text-gray-600 mt-2">Interactive CRM dashboard with real-time insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Live Demo
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnimatedKPI
          icon={<DollarSign className="w-8 h-8" />}
          title="Total Revenue"
          value={`$${currentData.revenue.toLocaleString()}`}
          change="+23.5%"
          isPositive={true}
          delay={0}
        />
        <AnimatedKPI
          icon={<Target className="w-8 h-8" />}
          title="Active Deals"
          value={currentData.deals}
          change="+12.3%"
          isPositive={true}
          delay={100}
        />
        <AnimatedKPI
          icon={<Users className="w-8 h-8" />}
          title="Total Contacts"
          value={currentData.contacts.toLocaleString()}
          change="+8.7%"
          isPositive={true}
          delay={200}
        />
        <AnimatedKPI
          icon={<TrendingUp className="w-8 h-8" />}
          title="Win Rate"
          value={`${currentData.winRate}%`}
          change="+5.2%"
          isPositive={true}
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Activities</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-500 hover:bg-gray-50 cursor-pointer ${
                  animateKPIs ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="flex-shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Upcoming Tasks</h3>
            <button className="text-blue-600 hover:text-blue-800">
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingTasks.map((task, index) => (
              <div 
                key={task.id}
                className={`p-3 rounded-lg border-l-4 transition-all duration-500 cursor-pointer hover:bg-gray-50 ${
                  task.priority === 'high' ? 'border-red-400 bg-red-50' :
                  task.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                  'border-gray-400 bg-gray-50'
                } ${animateKPIs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {task.task}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-600">{task.due}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Experience the Full CRM</h3>
            <p className="opacity-90">See how our AI-powered dashboard can transform your sales process</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
              Start Free Trial
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDemo;