import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const RecentActivity: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  
  // Updated upcomingDeals with contactId instead of direct avatar
  const upcomingDeals = [
    {
      id: 1,
      company: 'TechCorp Solutions',
      value: '$85,000',
      probability: '85%',
      dueDate: 'Tomorrow',
      contactId: '1', // Changed from contact+avatar to contactId
      status: 'online'
    },
    {
      id: 2,
      company: 'Innovation Labs',
      value: '$120,000',
      probability: '60%',
      dueDate: 'Friday',
      contactId: '2',
      status: 'offline'
    },
    {
      id: 3,
      company: 'Global Dynamics',
      value: '$95,500',
      probability: '75%',
      dueDate: 'Next Week',
      contactId: '3',
      status: 'online'
    }
  ];

  const [batchJobs, setBatchJobs] = React.useState([]);
  const [aiInsights, setAIInsights] = React.useState(new Map());

  // DISABLED: Using demo data only - no API calls
  React.useEffect(() => {
    // const checkBatchJobs = async () => {
    //   const { batchAPIService } = await import('../../services/openai-batch-api.service');
    //   const jobs = batchAPIService.getAllBatchJobs();
    //   setBatchJobs(jobs.slice(0, 2)); // Show latest 2 batch jobs
    // };
    
    // // Background AI processing for all visible deals
    // const processDealsInBackground = async () => {
    //   const { aiOrchestrator } = await import('../../services/ai-orchestrator.service');
    //   
    //   for (const deal of upcomingDeals) {
    //     // Generate insights without blocking UI
    //     try {
    //       const insightId = await aiOrchestrator.submitRequest({
    //         type: 'insights_generation',
    //         priority: 'low',
    //         data: { dealId: deal.id, contactId: deal.contactId },
    //         options: { useCache: true }
    //       });
    //       
    //       // Store insight ID for later retrieval
    //       setAIInsights(prev => new Map(prev.set(deal.id, insightId)));
    //     } catch (error) {
    //       console.debug('Background AI processing skipped:', error);
    //     }
    //   }
    // };
    
    // checkBatchJobs();
    // processDealsInBackground();
    
    // const interval = setInterval(() => {
    //   checkBatchJobs();
    //   processDealsInBackground();
    // }, 30000);
    
    // return () => clearInterval(interval);
  }, []);

  const recentActivities = [
    ...batchJobs.map(job => ({
      type: 'batch_job',
      icon: job.status === 'completed' ? CheckCircle : job.status === 'processing' ? TrendingUp : AlertCircle,
      title: `Batch ${job.type.replace('_', ' ')}`,
      description: `${job.itemCount} items - ${job.status}`,
      time: new Date(job.createdAt).toLocaleTimeString(),
      color: job.status === 'completed' ? 'text-green-600' : job.status === 'processing' ? 'text-blue-600' : 'text-yellow-600',
      assistantInsight: `Cost: $${job.estimatedCost.toFixed(4)} - 50% savings with overnight processing`
    })),
    {
      type: 'deal',
      icon: TrendingUp,
      title: 'Deal moved to negotiation',
      description: 'TechCorp Solutions - $85,000',
      time: '2 hours ago',
      color: 'text-blue-600',
      assistantInsight: 'Pipeline Bot: Deal velocity 23% above average. Recommend priority follow-up.',
      assistantThreadId: 'thread_deal_techcorp_001'
    },
    {
      type: 'task',
      icon: CheckCircle,
      title: 'Task completed',
      description: 'Follow-up call with Innovation Labs',
      time: '4 hours ago',
      color: 'text-green-600'
    },
    {
      type: 'meeting',
      icon: Calendar,
      title: 'Meeting scheduled',
      description: 'Product demo with Global Dynamics',
      time: '6 hours ago',
      color: 'text-purple-600'
    },
    {
      type: 'alert',
      icon: AlertCircle,
      title: 'Deal at risk',
      description: 'No activity on Enterprise Corp deal',
      time: '1 day ago',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Upcoming Deals Section */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Upcoming Deals</h3>
          <Link 
            to="/deals"
            className={`flex items-center space-x-1 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="space-y-4">
          {upcomingDeals.map((deal) => {
            // Get contact data using contactId
            const contact = contacts[deal.contactId];
            
            return (
              <div 
                key={deal.id} 
                className={`flex items-center justify-between p-4 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-100/80'} rounded-xl transition-colors cursor-pointer`}
                onClick={() => window.location.href = `/deals/${deal.id}`}
              >
                <div className="flex items-center space-x-3">
                  {contact && (
                    <Avatar
                      src={contact.avatarSrc || contact.avatar}
                      alt={contact.name}
                      size="sm"
                      fallback={getInitials(contact.name)}
                      status={deal.status as 'online' | 'offline' | 'away' | 'busy'}
                    />
                  )}
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{deal.company}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact ? contact.name : 'Unknown Contact'}
                    </p>
                  </div>
                </div>
                <div className="text-right group">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{deal.value}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{deal.probability} • {deal.dueDate}</p>
                  
                  {/* AI Insights Tooltip - appears on hover */}
                  <div className={`absolute right-0 top-full mt-2 w-72 p-3 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto ${
                    isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}>
                    <div className="text-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="font-medium">AI Risk Score: Low (15%)</span>
                      </div>
                      <p className="text-xs opacity-75">
                        Strong engagement signals. Last contact 2 days ago. Recommend follow-up by Friday.
                      </p>
                      <div className="flex items-center space-x-1 text-xs font-medium text-blue-400">
                        <span>🎯</span>
                        <span>Auto-scheduling follow-up...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>24 completed</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>8 pending</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className={`flex items-start space-x-3 p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/80'} rounded-lg transition-colors`}>
                <div className={`p-2 rounded-lg ${activity.color} ${isDark ? 'bg-opacity-10' : 'bg-opacity-10'}`}>
                  <Icon className={`w-4 h-4 ${isDark ? activity.color : activity.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{activity.title}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{activity.description}</p>
                  {activity.assistantInsight && (
                    <div className={`mt-2 p-2 rounded-md text-xs ${
                      isDark ? 'bg-blue-400/10 border border-blue-400/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      <div className="flex items-center space-x-1 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span className="font-medium">Assistant Insight</span>
                      </div>
                      {activity.assistantInsight}
                    </div>
                  )}
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;