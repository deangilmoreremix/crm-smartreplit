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
  ExternalLink,
  Play,
  Maximize2
} from 'lucide-react';

const EmbeddedDashboardDemo: React.FC = () => {
  const [animateKPIs, setAnimateKPIs] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateKPIs(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setSelectedTimeframe(prev => {
          if (prev === '7d') return '30d';
          if (prev === '30d') return '90d';
          return '7d';
        });
      }, 2000);
      
      const stopTimer = setTimeout(() => {
        setIsPlaying(false);
        clearInterval(interval);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(stopTimer);
      };
    }
  }, [isPlaying]);

  const kpiData = {
    '7d': { revenue: 24750, deals: 8, contacts: 342, winRate: 67 },
    '30d': { revenue: 127500, deals: 24, contacts: 1248, winRate: 85 },
    '90d': { revenue: 345000, deals: 67, contacts: 3240, winRate: 78 }
  };

  const currentData = kpiData[selectedTimeframe as keyof typeof kpiData];

  const recentActivities = [
    {
      id: 1,
      title: 'Acme Corp deal closed',
      value: '$15,000',
      time: '2 hours ago',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      id: 2,
      title: 'Demo call with TechStart Inc',
      value: 'High priority',
      time: '4 hours ago',
      icon: <Calendar className="w-4 h-4 text-blue-500" />
    },
    {
      id: 3,
      title: 'Follow-up sent to 12 prospects',
      value: 'Campaign complete',
      time: '6 hours ago',
      icon: <Mail className="w-4 h-4 text-purple-500" />
    }
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
      className={`bg-white rounded-lg p-4 shadow-lg border transition-all duration-700 hover:shadow-xl cursor-pointer ${
        animateKPIs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600 opacity-80">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center">
        {isPositive ? (
          <ArrowUp className="w-3 h-3 text-green-500" />
        ) : (
          <ArrowDown className="w-3 h-3 text-red-500" />
        )}
        <span className={`text-xs font-medium ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500 ml-1">vs last period</span>
      </div>
    </div>
  );

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl shadow-2xl border border-gray-200 max-w-5xl mx-auto">
      {/* Demo Header with Play Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gray-900">Live CRM Dashboard</h3>
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              ✓ Interactive Demo
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Click and explore the features below</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isPlaying 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{isPlaying ? 'Stop Demo' : 'Auto Demo'}</span>
          </button>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={isPlaying}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnimatedKPI
          icon={<DollarSign className="w-6 h-6" />}
          title="Total Revenue"
          value={`$${currentData.revenue.toLocaleString()}`}
          change="+23.5%"
          isPositive={true}
          delay={0}
        />
        <AnimatedKPI
          icon={<Target className="w-6 h-6" />}
          title="Active Deals"
          value={currentData.deals}
          change="+12.3%"
          isPositive={true}
          delay={100}
        />
        <AnimatedKPI
          icon={<Users className="w-6 h-6" />}
          title="Total Contacts"
          value={currentData.contacts.toLocaleString()}
          change="+8.7%"
          isPositive={true}
          delay={200}
        />
        <AnimatedKPI
          icon={<TrendingUp className="w-6 h-6" />}
          title="Win Rate"
          value={`${currentData.winRate}%`}
          change="+5.2%"
          isPositive={true}
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Recent Activities</h4>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-500 hover:bg-gray-50 cursor-pointer ${
                  animateKPIs ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="flex-shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Pipeline</h4>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span className="text-sm text-gray-700">Prospecting</span>
              <span className="font-semibold text-blue-600">$45K</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
              <span className="text-sm text-gray-700">Qualification</span>
              <span className="font-semibold text-yellow-600">$32K</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
              <span className="text-sm text-gray-700">Proposal</span>
              <span className="font-semibold text-orange-600">$28K</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="text-sm text-gray-700">Negotiation</span>
              <span className="font-semibold text-green-600">$22K</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Total Pipeline</span>
              <span className="text-lg font-bold text-blue-600">$127K</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h4 className="font-semibold mb-1">Ready to try the full dashboard?</h4>
            <p className="text-sm opacity-90">Explore all features with your own data</p>
          </div>
          <div className="flex space-x-3 mt-3 sm:mt-0">
            <button 
              onClick={() => window.open('/demo/dashboard', '_blank')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center text-sm"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Full Demo
            </button>
            <button 
              onClick={() => window.open('/signup', '_blank')}
              className="border border-white text-white px-4 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-sm"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedDashboardDemo;