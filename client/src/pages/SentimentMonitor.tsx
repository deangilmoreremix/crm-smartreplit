
import React from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  Heart, 
  Frown, 
  Smile, 
  Meh,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Activity,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const SentimentMonitor: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate sentiment metrics
  const totalMessages = 456;
  const positiveCount = 287;
  const neutralCount = 123;
  const negativeCount = 46;
  const overallSentiment = 72; // percentage positive

  // Get contacts for sentiment analysis
  const topContacts = Object.values(contacts).slice(0, 6);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const sentimentInsights = [
    {
      type: 'Positive Trend',
      insight: 'Customer satisfaction increased 15% this week',
      detail: 'Recent product updates driving positive feedback',
      sentiment: 'positive',
      impact: 'High'
    },
    {
      type: 'Neutral Pattern',
      insight: 'Technical support conversations remain neutral',
      detail: 'Opportunities to improve support experience',
      sentiment: 'neutral',
      impact: 'Medium'
    },
    {
      type: 'Negative Alert',
      insight: '3 customers expressed pricing concerns',
      detail: 'Consider value proposition refinement',
      sentiment: 'negative',
      impact: 'Critical'
    },
    {
      type: 'Engagement Boost',
      insight: 'Video calls generate 40% more positive sentiment',
      detail: 'Prioritize face-to-face interactions',
      sentiment: 'positive',
      impact: 'Strategic'
    }
  ];

  const recentSentimentActivity = [
    { contact: 'Jane Doe', message: 'Love the new features!', sentiment: 'positive', score: 0.9, time: '5 min ago' },
    { contact: 'Darlene Robertson', message: 'Need clarification on pricing', sentiment: 'neutral', score: 0.1, time: '15 min ago' },
    { contact: 'Wade Warren', message: 'This is exactly what we needed', sentiment: 'positive', score: 0.8, time: '1 hour ago' },
    { contact: 'Kathryn Murphy', message: 'Having some technical issues', sentiment: 'negative', score: -0.6, time: '2 hours ago' },
    { contact: 'Jerome Bell', message: 'Thanks for the quick response', sentiment: 'positive', score: 0.7, time: '3 hours ago' }
  ];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return Smile;
      case 'negative': return Frown;
      default: return Meh;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-50 text-green-700 border-green-200';
      case 'negative': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'bg-red-500/20 text-red-500';
      case 'High': return 'bg-orange-500/20 text-orange-500';
      case 'Strategic': return 'bg-blue-500/20 text-blue-500';
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
              Sentiment Monitor
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time message sentiment analysis and customer mood tracking
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Activity className="h-3 w-3 mr-1" />
              Live Monitoring
            </Badge>
          </div>
        </div>

        {/* Sentiment Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Overall Sentiment
              </CardTitle>
              <Heart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {overallSentiment}%
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% this week
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Positive Messages
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {positiveCount}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {Math.round((positiveCount / totalMessages) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Neutral Messages
              </CardTitle>
              <Meh className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {neutralCount}
              </div>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <BarChart3 className="h-3 w-3 mr-1" />
                {Math.round((neutralCount / totalMessages) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Negative Messages
              </CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {negativeCount}
              </div>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                {Math.round((negativeCount / totalMessages) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment Distribution Chart */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-24">
                  <Smile className="h-4 w-4 text-green-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Positive</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className="bg-green-500 h-3 rounded-full" 
                    style={{ width: `${(positiveCount / totalMessages) * 100}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} w-16 text-right`}>
                  {positiveCount}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-24">
                  <Meh className="h-4 w-4 text-yellow-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Neutral</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full" 
                    style={{ width: `${(neutralCount / totalMessages) * 100}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} w-16 text-right`}>
                  {neutralCount}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-24">
                  <Frown className="h-4 w-4 text-red-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Negative</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className="bg-red-500 h-3 rounded-full" 
                    style={{ width: `${(negativeCount / totalMessages) * 100}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} w-16 text-right`}>
                  {negativeCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Insights */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Sentiment Analysis Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentimentInsights.map((insight, index) => {
              const SentimentIcon = getSentimentIcon(insight.sentiment);
              return (
                <div key={index} className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <SentimentIcon className={`h-5 w-5 ${getSentimentColor(insight.sentiment)}`} />
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {insight.type}
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {insight.insight}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    💡 {insight.detail}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Contact Sentiment Analysis */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
              Contact Sentiment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topContacts.map((contact) => {
                const sentiments = ['positive', 'neutral', 'negative'];
                const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
                const score = randomSentiment === 'positive' ? Math.random() * 0.5 + 0.5 :
                              randomSentiment === 'negative' ? Math.random() * -0.5 - 0.1 :
                              Math.random() * 0.4 - 0.2;
                
                return (
                  <div 
                    key={contact.id} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border ${
                      randomSentiment === 'positive' 
                        ? (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200') :
                      randomSentiment === 'negative' 
                        ? (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200') :
                        (isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200')
                    }`}
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
                        <Badge variant="outline" className={`text-xs ${getSentimentBadgeColor(randomSentiment)}`}>
                          {randomSentiment}
                        </Badge>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Score: {score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sentiment Activity */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Recent Sentiment Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSentimentActivity.map((activity, index) => {
              const SentimentIcon = getSentimentIcon(activity.sentiment);
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.sentiment === 'positive' 
                      ? 'bg-green-500/20 text-green-500' :
                    activity.sentiment === 'negative' 
                      ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    <SentimentIcon className="h-4 w-4" />
                  </div>
                  <Avatar
                    size="sm"
                    fallback={getInitials(activity.contact)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {activity.contact}
                    </p>
                    <p className={`text-sm truncate ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      "{activity.message}" • {activity.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentBadgeColor(activity.sentiment)}`}
                    >
                      {activity.sentiment}
                    </Badge>
                    <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.score.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SentimentMonitor;
