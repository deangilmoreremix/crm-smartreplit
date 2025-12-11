import React, { useState } from 'react';
import { Goal } from '../../types/goals';
import { GOALS, GOAL_CATEGORIES } from '../../data/goals';
import InteractiveGoalCard from '../../components/InteractiveGoalCardComplete';
import GoalExecutionModal from '../../components/GoalExecutionModalComplete';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Brain, Info, Lightbulb, ArrowLeft, Sparkles, Zap, Target, Users, BarChart3, Bot, Activity, Search, Filter, Grid3X3, List, Play, Eye, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define context type
interface AIGoalContext {
  type: 'contact' | 'deal' | 'company';
  name?: string;
  title?: string;
  id?: string;
}

const AIGoalsPageFixed: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [realMode, setRealMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [executingGoals, setExecutingGoals] = useState<Set<string>>(new Set());
  
  const navigate = useNavigate();
  
  // Get context from session storage
  const [context, setContext] = useState<AIGoalContext | null>(() => {
    try {
      const savedContext = sessionStorage.getItem('currentEntityContext');
      return savedContext ? JSON.parse(savedContext) : null;
    } catch {
      return null;
    }
  });

  // Filter goals based on current filters
  const filteredGoals = GOALS.filter(goal => {
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'all' || goal.complexity === selectedComplexity;
    
    // Map complexity to priority for filtering
    const priority = goal.complexity === 'Advanced' ? 'High' : 
                    goal.complexity === 'Intermediate' ? 'Medium' : 'Low';
    const matchesPriority = selectedPriority === 'all' || priority === selectedPriority;
    
    const matchesSearch = searchQuery === '' || 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesComplexity && matchesPriority && matchesSearch;
  });

  const handleGoalSelected = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowExecutionModal(true);
  };

  const handleGoalExecute = (goal: Goal) => {
    setExecutingGoals(prev => new Set([...prev, goal.id]));
    handleGoalSelected(goal);
  };

  const handleModeToggle = (mode: boolean) => {
    setRealMode(mode);
  };

  const handleCloseModal = () => {
    setShowExecutionModal(false);
    setSelectedGoal(null);
  };

  const handleGoalComplete = (results: any) => {
    console.log('Goal completed:', selectedGoal?.title, results);
    if (selectedGoal) {
      setExecutingGoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedGoal.id);
        return newSet;
      });
    }
    setShowExecutionModal(false);
    setSelectedGoal(null);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return GOALS.length;
    return GOALS.filter(goal => goal.category === category).length;
  };

  const priorityLevels = ['all', 'High', 'Medium', 'Low'];
  const complexityLevels = ['all', 'Simple', 'Intermediate', 'Advanced'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-800 dark:via-purple-800 dark:to-blue-800">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"></div>
        
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-white/20">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    AI Goals Platform
                  </h1>
                  <p className="text-xl text-white/90 dark:text-white/80">
                    Intelligent business automation through multi-agent AI coordination
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">Execution Mode:</span>
                <div className="flex bg-white/20 dark:bg-black/20 rounded-lg p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setRealMode(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !realMode ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    🎭 Demo Mode
                  </button>
                  <button
                    onClick={() => setRealMode(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      realMode ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    🚀 Live Mode
                  </button>
                </div>
              </div>
              
              {realMode ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">Real AI execution enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg backdrop-blur-sm">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Demo mode - Click Live Mode for real execution</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Awareness Card */}
      {context && (
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Context-Aware AI Execution
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200">
                      Ready to execute AI goals with intelligent context detection for {context.type}: {context.name || context.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* System Stats */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700/50">
              <CardContent className="p-4 text-center">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">17</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Active Agents</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700/50">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{GOALS.length}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Available Goals</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700/50">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">8</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Categories</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700/50">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">98.5%</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Goal Explorer */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8">
            
            {/* Search and Filters */}
            <div className="mb-8 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search goals by title, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid md:grid-cols-3 gap-6 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      {priorityLevels.map(priority => (
                        <option key={priority} value={priority}>
                          {priority === 'all' ? 'All Priorities' : priority}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Complexity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complexity</label>
                    <select
                      value={selectedComplexity}
                      onChange={(e) => setSelectedComplexity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      {complexityLevels.map(complexity => (
                        <option key={complexity} value={complexity}>
                          {complexity === 'all' ? 'All Complexities' : complexity}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="all">All Categories</option>
                      {GOAL_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category} ({getCategoryCount(category)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredGoals.length} of {GOALS.length} goals
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              
              {filteredGoals.length === 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedPriority('all');
                    setSelectedComplexity('all');
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Goals Grid */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredGoals.map((goal) => (
                <InteractiveGoalCard
                  key={goal.id}
                  goal={goal}
                  onExecute={handleGoalExecute}
                  isExecuting={executingGoals.has(goal.id)}
                  executionProgress={executingGoals.has(goal.id) ? 45 : 0}
                  realMode={realMode}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredGoals.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No goals found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedPriority('all');
                    setSelectedComplexity('all');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Goal Execution Modal */}
      {showExecutionModal && selectedGoal && (
        <GoalExecutionModal
          goal={selectedGoal}
          isOpen={showExecutionModal}
          onClose={handleCloseModal}
          realMode={realMode}
          onComplete={handleGoalComplete}
          contextData={context}
        />
      )}
    </div>
  );
};

export default AIGoalsPageFixed;