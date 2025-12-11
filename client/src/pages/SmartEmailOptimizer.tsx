
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  Mail, 
  Zap, 
  TrendingUp, 
  Target,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Lightbulb,
  Edit3
} from 'lucide-react';

const SmartEmailOptimizer: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate email optimization metrics
  const totalEmails = 234;
  const optimizedEmails = 189;
  const openRate = 68; // percentage
  const responseRate = 24; // percentage

  // Get contacts for optimization suggestions
  const topContacts = Object.values(contacts).slice(0, 6);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const emailOptimizations = [
    {
      type: 'Subject Line',
      suggestion: 'Add urgency keywords to increase open rates',
      impact: '+15% open rate',
      priority: 'High',
      example: '"Limited Time: Transform Your Sales Process"'
    },
    {
      type: 'Personalization',
      suggestion: 'Include company-specific pain points',
      impact: '+28% response rate',
      priority: 'Critical',
      example: 'Reference recent news about their industry'
    },
    {
      type: 'Send Time',
      suggestion: 'Send at 9:30 AM for optimal engagement',
      impact: '+12% open rate',
      priority: 'Medium',
      example: 'Tuesdays and Thursdays perform best'
    },
    {
      type: 'Call-to-Action',
      suggestion: 'Use action-oriented button text',
      impact: '+20% click rate',
      priority: 'High',
      example: '"Book Your Strategy Call" vs "Learn More"'
    }
  ];

  const recentOptimizations = [
    { email: 'Follow-up sequence to Fortune 500', improvement: '45% higher response', status: 'success' },
    { email: 'Product demo invitation', improvement: '32% more bookings', status: 'success' },
    { email: 'Proposal delivery email', improvement: '18% faster responses', status: 'success' },
    { email: 'Re-engagement campaign', improvement: '25% higher opens', status: 'success' },
    { email: 'Cold outreach template', improvement: 'Testing in progress', status: 'testing' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/20 text-red-500';
      case 'High': return 'bg-orange-500/20 text-orange-500';
      case 'Medium': return 'bg-blue-500/20 text-blue-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Smart Email Optimizer
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-powered email response optimization and performance insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              AI Optimizing
            </Badge>
          </div>
        </div>

        {/* Optimization Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Emails
              </CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalEmails}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% this month
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Optimized Emails
              </CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {optimizedEmails}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {Math.round((optimizedEmails / totalEmails) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Open Rate
              </CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {openRate}%
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% improvement
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Response Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {responseRate}%
              </div>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Optimization Suggestions */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              AI-Powered Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailOptimizations.map((optimization, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Edit3 className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {optimization.type}
                      </h4>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {optimization.suggestion}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={`text-xs ${getPriorityColor(optimization.priority)}`}>
                      {optimization.priority}
                    </Badge>
                    <span className="text-sm font-medium text-green-600">
                      {optimization.impact}
                    </span>
                  </div>
                </div>
                <div className={`text-sm italic p-3 rounded ${
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-blue-50 text-blue-700'
                }`}>
                  💡 Example: {optimization.example}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Email Performance by Contact */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Email Performance by Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topContacts.map((contact) => {
                const openRate = Math.floor(Math.random() * 40) + 40; // 40-80%
                const responseRate = Math.floor(Math.random() * 30) + 10; // 10-40%
                
                return (
                  <div 
                    key={contact.id} 
                    className={`flex items-center space-x-3 p-4 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors cursor-pointer`}
                  >
                    <Avatar
                      src={contact.avatarSrc}
                      size="md"
                      fallback={getInitials(contact.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {contact.name}
                      </p>
                      <p className={`text-sm truncate ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {contact.company || 'No company'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {openRate}% open
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {responseRate}% response
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Optimizations */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Recent Email Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOptimizations.map((optimization, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  optimization.status === 'success' 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {optimization.status === 'success' ? 
                    <CheckCircle className="h-4 w-4" /> : 
                    <AlertTriangle className="h-4 w-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {optimization.email}
                  </p>
                  <p className={`text-sm truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Result: {optimization.improvement}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    optimization.status === 'success' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {optimization.status === 'success' ? 'Optimized' : 'Testing'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartEmailOptimizer;
