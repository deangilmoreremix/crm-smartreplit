import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  Zap, 
  Play,
  Eye,
  CheckCircle,
  Star,
  Target,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface InteractiveGoalCardProps {
  goal: Goal;
  onExecute: (goal: Goal) => void;
  onPreview?: (goal: Goal) => void;
  isExecuting?: boolean;
  executionProgress?: number;
  isCompleted?: boolean;
  realMode?: boolean;
  showExpandedDetails?: boolean;
  onToggleDetails?: () => void;
}

const InteractiveGoalCard: React.FC<InteractiveGoalCardProps> = ({
  goal,
  onExecute,
  onPreview,
  isExecuting = false,
  executionProgress = 0,
  isCompleted = false,
  realMode = false,
  showExpandedDetails = false,
  onToggleDetails
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    estimatedValue: parseInt(goal.roi.replace(/[^0-9]/g, '')) * 1000 || 25000,
    timeToComplete: parseInt(goal.estimatedSetupTime.replace(/[^0-9]/g, '')) || 15,
    confidence: goal.priority === 'High' ? 95 : goal.priority === 'Medium' ? 85 : 75,
    agentsRequired: goal.agentsRequired.length || 3
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'from-red-500 to-orange-500';
      case 'Medium': return 'from-yellow-500 to-orange-500';
      case 'Low': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return <Zap className="h-4 w-4" />;
      case 'Intermediate': return <Target className="h-4 w-4" />;
      case 'Advanced': return <Star className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sales': return 'from-blue-500 to-blue-600';
      case 'Marketing': return 'from-purple-500 to-purple-600';
      case 'Relationship': return 'from-green-500 to-green-600';
      case 'Automation': return 'from-orange-500 to-orange-600';
      case 'Analytics': return 'from-teal-500 to-teal-600';
      case 'Content': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // Calculate estimated value based on goal properties
  const getEstimatedValue = (): string => {
    const baseValue = parseInt(goal.roi.replace(/[^0-9]/g, '')) || 300;
    const multiplier = goal.priority === 'High' ? 10000 : goal.priority === 'Medium' ? 5000 : 2000;
    const complexity = goal.complexity === 'Advanced' ? 1.5 : goal.complexity === 'Intermediate' ? 1.2 : 1.0;
    
    const estimatedValue = baseValue * multiplier * complexity;
    
    if (estimatedValue >= 1000000) {
      return `$${(estimatedValue / 1000000).toFixed(1)}M`;
    } else if (estimatedValue >= 1000) {
      return `$${(estimatedValue / 1000).toFixed(0)}K`;
    }
    return `$${estimatedValue.toLocaleString()}`;
  };

  // Simulate live metrics updates in real mode
  useEffect(() => {
    if (realMode && isHovered) {
      const interval = setInterval(() => {
        setLiveMetrics(prev => ({
          ...prev,
          estimatedValue: prev.estimatedValue + Math.floor(Math.random() * 500 - 250),
          confidence: Math.min(99, Math.max(70, prev.confidence + Math.random() * 2 - 1))
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [realMode, isHovered]);

  return (
    <div 
      className={`relative group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
        isExecuting ? 'ring-2 ring-blue-500 animate-pulse' : ''
      } ${isCompleted ? 'ring-2 ring-green-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Category Badge and Priority */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(goal.category)} opacity-10`}></div>
        <div className="relative p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(goal.category)} text-white shadow-lg`}>
                <Target className="h-5 w-5" />
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getPriorityColor(goal.priority)} text-white`}>
                  {goal.priority} Priority
                </span>
                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {getComplexityIcon(goal.complexity)}
                  <span className="ml-1">{goal.complexity}</span>
                </div>
              </div>
            </div>
            
            {isCompleted && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {goal.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
            {goal.description}
          </p>
        </div>
      </div>

      {/* Progress Bar (when executing) */}
      {isExecuting && (
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Executing...</span>
            <span>{Math.round(executionProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${executionProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Clock className="h-3 w-3 mr-1" />
              Setup Time
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {goal.estimatedSetupTime}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Estimated Value
            </div>
            <div className="font-semibold text-green-600 dark:text-green-400 text-sm">
              {getEstimatedValue()}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Users className="h-3 w-3 mr-1" />
              Agents
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {liveMetrics.agentsRequired}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Star className="h-3 w-3 mr-1" />
              Success Rate
            </div>
            <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
              {liveMetrics.confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* Real Mode Live Metrics */}
      {realMode && isHovered && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700 dark:text-green-300 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Live AI Metrics
              </div>
              <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                ${liveMetrics.estimatedValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => onExecute(goal)}
            disabled={isExecuting}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              isExecuting 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : isCompleted
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                : realMode
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                Executing...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {realMode ? 'Execute Live' : 'Preview'}
              </>
            )}
          </button>
          
          {onPreview && !isExecuting && (
            <button
              onClick={() => onPreview(goal)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hover Overlay with Quick Info */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
        <div className="absolute bottom-4 left-6 right-6">
          <div className="text-white text-xs space-y-1">
            <div className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>{goal.businessImpact}</span>
            </div>
            <div className="flex items-center">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span>{goal.agentsRequired.length} AI agents required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGoalCard;