import React from 'react';
import { Target, TrendingUp, CheckSquare, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface Goal {
  id: number;
  name: string;
  progress: number;
  category: string;
  daysLeft?: number;
}

const AIGoalsCard: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const goals: Goal[] = [
    { id: 1, name: 'Increase Lead Conversion', progress: 65, category: 'Sales', daysLeft: 12 },
    { id: 2, name: 'Optimize Email Campaigns', progress: 45, category: 'Marketing', daysLeft: 5 },
    { id: 3, name: 'Reduce Deal Cycle Time', progress: 80, category: 'Operations' }
  ];
  
  const handleViewAll = () => {
    navigate('/ai-goals');
  };
  
  return (
    <div className={`rounded-xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
      <div className={`p-4 flex justify-between items-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <Target className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Goals</h3>
        </div>
        <button 
          onClick={handleViewAll}
          className={`text-xs font-medium flex items-center space-x-1 ${
            isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
          }`}
        >
          <span>View All</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {goal.name}
                  </h4>
                  {goal.daysLeft && (
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {goal.daysLeft} days left
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{goal.category}</p>
              </div>
              
              <div className={`text-xs font-medium ${
                goal.progress >= 80 
                  ? (isDark ? 'text-green-400' : 'text-green-600') 
                  : goal.progress >= 40 
                  ? (isDark ? 'text-yellow-400' : 'text-yellow-600')
                  : (isDark ? 'text-red-400' : 'text-red-600')
              }`}>
                {goal.progress}%
              </div>
            </div>
            
            {/* Progress bar */}
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full ${
                  goal.progress >= 80 
                    ? 'bg-green-500' 
                    : goal.progress >= 40 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
        
        <button
          onClick={handleViewAll} 
          className={`w-full py-2.5 mt-2 flex items-center justify-center space-x-2 rounded-lg border-2 border-dashed ${
            isDark 
              ? 'border-gray-700 hover:border-purple-500/30 text-gray-400 hover:text-purple-400' 
              : 'border-gray-300 hover:border-purple-300 text-gray-600 hover:text-purple-700'
          } transition-colors`}
        >
          <Target className="h-4 w-4" />
          <span className="text-sm font-medium">Add New Goal</span>
        </button>
      </div>
    </div>
  );
};

export default AIGoalsCard;