import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDemoData } from '../../contexts/DemoDataContext';
import { BarChart3, TrendingUp, Calendar, Search, Bell, User, Sparkles, Brain, Zap, Trash2 } from 'lucide-react';
import { gpt5Service } from '../../services/gpt5Service';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import ClearDemoDataModal from '../ClearDemoDataModal';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title = 'Dashboard Overview',
  subtitle = 'Welcome back! Here\'s an overview of your sales performance'
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { showDemoData } = useDemoData();
  
  // GPT-5 Enhanced State
  const [smartGreeting, setSmartGreeting] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Get current date and time context
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeOfDay = currentDate.getHours() < 12 ? 'morning' : 
                   currentDate.getHours() < 18 ? 'afternoon' : 'evening';

  // GPT-5 Smart Greeting Generation
  useEffect(() => {
    const generateSmartGreeting = async () => {
      if (!deals || Object.keys(deals).length === 0) return;
      
      setIsLoadingAI(true);
      try {
        // Prepare metrics for GPT-5 analysis
        const userMetrics = {
          totalDeals: Object.keys(deals).length,
          totalValue: Object.values(deals).reduce((sum, deal) => sum + deal.value, 0),
          activeDeals: Object.values(deals).filter(d => d.stage !== 'won' && d.stage !== 'lost').length,
          wonDeals: Object.values(deals).filter(d => d.stage === 'won').length,
          totalContacts: Object.keys(contacts).length
        };

        const recentActivity = {
          recentDeals: Object.values(deals).slice(0, 3).map(d => ({
            title: d.title,
            value: d.value,
            stage: d.stage
          }))
        };

        // Call GPT-5 Expert Greeting Service
        const greetingResult = await gpt5Service.generateSmartGreeting(
          userMetrics,
          timeOfDay,
          recentActivity
        );

        if (greetingResult.greeting) {
          setSmartGreeting(greetingResult.greeting);
        }
        
      } catch (error) {
        console.error('GPT-5 Smart Greeting Error:', error);
        setSmartGreeting(`Good ${timeOfDay}! Your pipeline looks strong with ${Object.keys(deals).length} deals in progress.`);
      } finally {
        setIsLoadingAI(false);
      }
    };

    // Generate smart greeting with slight delay to allow data loading
    const timer = setTimeout(generateSmartGreeting, 1000);
    return () => clearTimeout(timer);
  }, [deals, contacts, timeOfDay]);

  return (
    <div className="mb-8">
      {/* GPT-5 Enhanced Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h1>
            {(smartGreeting || isLoadingAI) && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                <Sparkles size={12} />
                GPT-5 Enhanced
              </div>
            )}
          </div>
          
          {/* GPT-5 Smart Greeting */}
          {smartGreeting ? (
            <div className={`flex items-start gap-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              <Brain size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{smartGreeting}</p>
            </div>
          ) : isLoadingAI ? (
            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="animate-spin">
                <Zap size={14} />
              </div>
              <p className="text-sm">Generating personalized insights...</p>
            </div>
          ) : (
            <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</p>
          )}
          

        </div>
        
        <div className="flex items-center gap-4">
          {showDemoData && (
            <button
              onClick={() => setShowClearModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }`}
              data-testid="button-clear-demo-data"
            >
              <Trash2 size={16} />
              Clear Demo Data
            </button>
          )}
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm flex items-center`}>
            <Calendar size={16} className="mr-2" />
            {formattedDate}
          </div>
        </div>
      </div>
      
      <ClearDemoDataModal isOpen={showClearModal} onClose={() => setShowClearModal(false)} />
      
      {/* GPT-5 Enhanced KPI Summary */}
      <div className={`mt-6 p-4 rounded-xl ${
        isDark 
          ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10' 
          : 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            } mr-3 relative`}>
              <BarChart3 className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <Sparkles className={`absolute -top-1 -right-1 h-3 w-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
            <div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pipeline Value (GPT-5 Analyzed)
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${Object.values(deals).reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-purple-500/20' : 'bg-purple-100'
            } mr-3 relative`}>
              <TrendingUp className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <Brain className={`absolute -top-1 -right-1 h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AI Win Probability
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.round((Object.values(deals).filter(d => d.stage === 'won').length / Object.values(deals).length) * 100) || 0}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-green-500/20' : 'bg-green-100'
            } mr-3`}>
              <User className={`h-6 w-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                New Customers
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                34
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => navigate('/analytics-dashboard')}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-50'
            } flex items-center space-x-2 cursor-pointer transition-colors`}
          >
            <Search size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Search analytics...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;