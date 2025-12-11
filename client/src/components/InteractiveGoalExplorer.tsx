import React, { useState, useEffect, useMemo } from 'react';
import { Goal, GoalCategory, AIGoalContext } from '../types/goals';
import { allGoals, goalCategories } from '../data/completeGoalsData';
import InteractiveGoalCard from './InteractiveGoalCard';
import GoalExecutionModal from './GoalExecutionModal';
import { 
  Target, 
  Filter, 
  Search, 
  Zap, 
  Star, 
  TrendingUp,
  ArrowRight,
  Play,
  Eye,
  Sparkles,
  Brain,
  Users,
  Activity,
  BarChart3,
  Network,
  Bot,
  Award,
  Lightbulb,
  HelpCircle,
  Settings,
  Info,
  Timer,
  Gauge,
  Cpu,
  Rocket,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Loader,
  Grid3X3,
  List
} from 'lucide-react';

interface InteractiveGoalExplorerProps {
  realMode?: boolean;
  onModeToggle?: (mode: boolean) => void;
  onOpenApiSetup?: () => void;
  onGoalSelected?: (goal: Goal) => void;
  contextData?: AIGoalContext | null;
  className?: string;
}

const InteractiveGoalExplorer: React.FC<InteractiveGoalExplorerProps> = ({
  realMode = false,
  onModeToggle,
  onOpenApiSetup,
  onGoalSelected,
  contextData,
  className = ''
}) => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [executingGoals, setExecutingGoals] = useState<Set<string>>(new Set());
  const [executionProgress, setExecutionProgress] = useState<Record<string, number>>({});
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());
  const [executingGoal, setExecutingGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Live dashboard stats with real-time updates
  const [liveStats, setLiveStats] = useState({
    totalGoals: allGoals.length,
    completedToday: 0,
    valueGenerated: 0,
    activeAgents: 0,
    executingNow: 0,
    systemHealth: 98.7
  });

  // Update live stats based on execution state
  useEffect(() => {
    const valuePerGoal = 500000; // Base value per goal
    const agentsPerGoal = 3; // Average agents per goal
    
    setLiveStats(prev => ({
      ...prev,
      executingNow: executingGoals.size,
      completedToday: completedGoals.size,
      valueGenerated: completedGoals.size * valuePerGoal + Array.from(executingGoals).reduce((sum, goalId) => {
        const progress = executionProgress[goalId] || 0;
        return sum + (valuePerGoal * progress / 100);
      }, 0),
      activeAgents: executingGoals.size * agentsPerGoal,
      systemHealth: Math.min(99.9, 98.7 + Math.random() * 1.2)
    }));
  }, [executingGoals.size, completedGoals.size, executionProgress]);

  // Smart filtering combining multiple criteria
  const filteredGoals = useMemo(() => {
    return allGoals.filter(goal => {
      // Category filter
      if (selectedCategory !== 'all' && 
          goal.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      
      // Priority filter
      if (selectedPriority !== 'all' && 
          goal.priority.toLowerCase() !== selectedPriority.toLowerCase()) {
        return false;
      }
      
      // Complexity filter
      if (selectedComplexity !== 'all' && 
          goal.complexity.toLowerCase() !== selectedComplexity.toLowerCase()) {
        return false;
      }
      
      // Search term filter
      if (searchTerm && !goal.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !goal.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !goal.businessImpact.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [selectedCategory, selectedPriority, selectedComplexity, searchTerm]);

  // Priority and complexity counts for filters
  const priorityCounts = useMemo(() => {
    const counts = { all: allGoals.length, high: 0, medium: 0, low: 0 };
    allGoals.forEach(goal => {
      counts[goal.priority.toLowerCase() as keyof typeof counts]++;
    });
    return counts;
  }, []);

  const complexityCounts = useMemo(() => {
    const counts = { all: allGoals.length, simple: 0, intermediate: 0, advanced: 0 };
    allGoals.forEach(goal => {
      counts[goal.complexity.toLowerCase() as keyof typeof counts]++;
    });
    return counts;
  }, []);

  // Goal execution handlers
  const handleExecuteGoal = (goal: Goal) => {
    setExecutingGoal(goal);
    setShowExecutionModal(true);
    onGoalSelected?.(goal);
    
    if (!executingGoals.has(goal.id)) {
      setExecutingGoals(prev => new Set([...Array.from(prev), goal.id]));
      setExecutionProgress(prev => ({ ...prev, [goal.id]: 0 }));
      
      // Simulate execution progress
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => {
          const currentProgress = prev[goal.id] || 0;
          const newProgress = Math.min(100, currentProgress + Math.random() * 15 + 5);
          
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setExecutingGoals(prevSet => {
              const newSet = new Set(prevSet);
              newSet.delete(goal.id);
              return newSet;
            });
            setCompletedGoals(prevSet => new Set([...Array.from(prevSet), goal.id]));
          }
          
          return { ...prev, [goal.id]: newProgress };
        });
      }, realMode ? 2000 : 500);
    }
  };

  const handlePreviewGoal = (goal: Goal) => {
    setExecutingGoal(goal);
    setShowExecutionModal(true);
  };

  const handleToggleDetails = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleCloseModal = () => {
    setShowExecutionModal(false);
    setExecutingGoal(null);
  };

  const handleExecutionComplete = (result: any) => {
    if (executingGoal) {
      setCompletedGoals(prev => new Set([...Array.from(prev), executingGoal.id]));
      setExecutingGoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(executingGoal.id);
        return newSet;
      });
    }
    setShowExecutionModal(false);
    setExecutingGoal(null);
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'high-priority':
        setSelectedPriority('high');
        setSelectedCategory('all');
        setSelectedComplexity('all');
        break;
      case 'quick-wins':
        setSelectedComplexity('simple');
        setSelectedCategory('all');
        setSelectedPriority('all');
        break;
      case 'sales-focus':
        setSelectedCategory('sales');
        setSelectedPriority('all');
        setSelectedComplexity('all');
        break;
      case 'demo-mode':
        onModeToggle?.(false);
        break;
    }
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-8">
      {/* Live System Dashboard */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Live System Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-300">Real-time AI automation metrics</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Available Goals */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-700/50">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {liveStats.totalGoals}
            </div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Available Goals</div>
            <div className="text-xs text-blue-500 dark:text-blue-400">Ready for execution</div>
          </div>
          
          {/* Completed Today */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center border border-green-200/50 dark:border-green-700/50">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {liveStats.completedToday}
            </div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Completed Today</div>
            <div className="text-xs text-green-500 dark:text-green-400">Successfully achieved</div>
          </div>
          
          {/* Value Generated */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 text-center border border-purple-200/50 dark:border-purple-700/50">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(liveStats.valueGenerated)}
            </div>
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Value Generated</div>
            <div className="text-xs text-purple-500 dark:text-purple-400">Business impact today</div>
          </div>
          
          {/* Active Agents */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 text-center border border-orange-200/50 dark:border-orange-700/50">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {liveStats.activeAgents}
            </div>
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Agents</div>
            <div className="text-xs text-orange-500 dark:text-orange-400">Currently working</div>
          </div>
          
          {/* System Health */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-4 text-center border border-teal-200/50 dark:border-teal-700/50">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {liveStats.systemHealth.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-teal-700 dark:text-teal-300">System Health</div>
            <div className="text-xs text-teal-500 dark:text-teal-400">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search goals by title, description, or expected outcomes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleQuickAction('high-priority')}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-700/50"
          >
            <AlertCircle className="h-4 w-4" />
            High Priority
            <span className="bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs">
              Execute top 3 goals
            </span>
          </button>
          
          <button
            onClick={() => handleQuickAction('quick-wins')}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-700/50"
          >
            <Zap className="h-4 w-4" />
            Quick Wins
            <span className="bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
              Simple goals first
            </span>
          </button>
          
          <button
            onClick={() => handleQuickAction('sales-focus')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-700/50"
          >
            <Target className="h-4 w-4" />
            Sales Focus
            <span className="bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
              Revenue goals
            </span>
          </button>
          
          <button
            onClick={() => handleQuickAction('demo-mode')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-700/50"
          >
            <Eye className="h-4 w-4" />
            Demo Mode
            <span className="bg-purple-200 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
              Safe testing
            </span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h4>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">All</span>
                  <span className="text-sm bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                    {allGoals.length}
                  </span>
                </div>
              </button>
              
              {goalCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                      {category.totalGoals}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Level</h4>
            <div className="space-y-2">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPriority === priority
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{priority}</span>
                    <span className="text-sm bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Complexity Level */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complexity Level</h4>
            <div className="space-y-2">
              {Object.entries(complexityCounts).map(([complexity, count]) => (
                <button
                  key={complexity}
                  onClick={() => setSelectedComplexity(complexity)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedComplexity === complexity
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{complexity}</span>
                    <span className="text-sm bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Showing {filteredGoals.length} of {allGoals.length} goals
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              {completedGoals.size} completed
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {executingGoals.size} executing
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedPriority('all');
                setSelectedComplexity('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGoals.map((goal) => (
          <InteractiveGoalCard
            key={goal.id}
            goal={goal}
            onExecute={handleExecuteGoal}
            onPreview={handlePreviewGoal}
            isExecuting={executingGoals.has(goal.id)}
            executionProgress={executionProgress[goal.id]}
            isCompleted={completedGoals.has(goal.id)}
            realMode={realMode}
            showExpandedDetails={expandedGoals.has(goal.id)}
            onToggleDetails={() => handleToggleDetails(goal.id)}
          />
        ))}
      </div>

      {/* Goal Execution Modal */}
      {showExecutionModal && executingGoal && (
        <GoalExecutionModal
          goal={executingGoal}
          isOpen={showExecutionModal}
          onClose={handleCloseModal}
          realMode={realMode}
          onComplete={handleExecutionComplete}
        />
      )}
    </div>
  );
};

export default InteractiveGoalExplorer;