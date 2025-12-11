import React, { useState } from 'react';
import { Goal } from '../../types/goals';
import InteractiveGoalExplorer from '../../components/InteractiveGoalExplorer';
import GoalExecutionModal from '../../components/GoalExecutionModal';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Brain, Info, Lightbulb, ArrowLeft, Sparkles, Zap, Target, Users, BarChart3, Bot, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAITools } from '../../components/AIToolsProvider';

// Define context type
interface AIGoalContext {
  type: 'contact' | 'deal' | 'company';
  name?: string;
  title?: string;
  id?: string;
}

const AIGoalsPage: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [realMode, setRealMode] = useState(false);
  
  const navigate = useNavigate();
  const { openTool } = useAITools();
  
  // Get context from session storage or URL params
  const [context, setContext] = useState<AIGoalContext | null>(() => {
    try {
      const savedContext = sessionStorage.getItem('currentEntityContext');
      return savedContext ? JSON.parse(savedContext) : null;
    } catch {
      return null;
    }
  });

  // Filter goals based on current criteria
  useEffect(() => {
    let filtered = aiGoals;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchGoals(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(goal => goal.category === selectedCategory);
    }

    // Apply priority filter
    if (selectedPriority !== 'All') {
      filtered = filtered.filter(goal => goal.priority === selectedPriority);
    }

    // Apply complexity filter
    if (selectedComplexity !== 'All') {
      filtered = filtered.filter(goal => goal.complexity === selectedComplexity);
    }

    setFilteredGoals(filtered);
  }, [searchQuery, selectedCategory, selectedPriority, selectedComplexity]);

  const handleExecuteGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsExecutionModalOpen(true);
    
    // Show notification about demo mode
    if (!realMode) {
      setTimeout(() => {
        console.log('💡 Tip: Switch to Live Mode above to execute real AI agents instead of demos');
      }, 1000);
    }
  };

  const handleCloseExecutionModal = () => {
    setIsExecutionModalOpen(false);
    setSelectedGoal(null);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Sales': <TrendingUp className="h-5 w-5" />,
      'Marketing': <Target className="h-5 w-5" />,
      'Relationship': <Users className="h-5 w-5" />,
      'Automation': <Zap className="h-5 w-5" />,
      'Analytics': <Activity className="h-5 w-5" />,
      'Content': <FileText className="h-5 w-5" />,
      'Admin': <Settings className="h-5 w-5" />,
      'AI-Native': <Brain className="h-5 w-5" />
    };
    return iconMap[category] || <Bot className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Sales': 'from-blue-500 to-blue-600',
      'Marketing': 'from-purple-500 to-purple-600',
      'Relationship': 'from-green-500 to-green-600',
      'Automation': 'from-orange-500 to-orange-600',
      'Analytics': 'from-teal-500 to-teal-600',
      'Content': 'from-yellow-500 to-yellow-600',
      'Admin': 'from-indigo-500 to-indigo-600',
      'AI-Native': 'from-pink-500 to-pink-600'
    };
    return colorMap[category] || 'from-gray-500 to-gray-600';
  };

  const getGoalsByCurrentCategory = () => {
    return selectedCategory === 'All' ? aiGoals : getGoalsByCategory(selectedCategory);
  };

  const categoryStats = goalCategories.map(category => ({
    name: category.name,
    id: category.id,
    count: getGoalsByCategory(category.id).length,
    icon: getCategoryIcon(category.id),
    color: getCategoryColor(category.id)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI Business Goals
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Transform your business with AI-powered automation. Choose from {aiGoals.length} pre-built goals across {goalCategories.length} categories.
              </p>
              
              {/* Mode Toggle with Enhanced UX */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Execution Mode:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setRealMode(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !realMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🎭 Demo Mode
                    </button>
                    <button
                      onClick={() => setRealMode(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        realMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🚀 Live Mode
                    </button>
                  </div>
                </div>
                
                {realMode ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">Real AI execution enabled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-700">Demo mode - Click Live Mode for real execution</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 lg:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{aiGoals.length}</div>
                <div className="text-sm text-gray-600">AI Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{goalCategories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">50+</div>
                <div className="text-sm text-gray-600">AI Agents</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {categoryStats.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} text-white border-transparent shadow-lg`
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-2 ${selectedCategory === category.id ? 'text-white' : 'text-gray-600'}`}>
                  {category.icon}
                </div>
                <div className="text-sm font-medium">{category.name}</div>
                <div className={`text-xs ${selectedCategory === category.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {category.count} goals
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search AI goals, agents, or tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Priorities</option>
                  {priorityLevels.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                <select
                  value={selectedComplexity}
                  onChange={(e) => setSelectedComplexity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Complexity Levels</option>
                  {complexityLevels.map(complexity => (
                    <option key={complexity} value={complexity}>{complexity}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Categories</option>
                  {goalCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory === 'All' ? 'All AI Goals' : `${selectedCategory} Goals`}
            </h2>
            <p className="text-gray-600">
              {filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          
          {filteredGoals.length > 0 && (
            <div className="text-sm text-gray-600">
              Total estimated setup time: {Math.round(filteredGoals.length * 1.5)} - {Math.round(filteredGoals.length * 3)} hours
            </div>
          )}
        </div>

        {/* Goals Grid/List */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find relevant AI goals.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedPriority('All');
                setSelectedComplexity('All');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredGoals.map((goal) => (
              <div key={goal.id} className={viewMode === 'list' ? 'bg-white rounded-xl p-4 border border-gray-200' : ''}>
                {viewMode === 'grid' ? (
                  <InteractiveGoalCard
                    goal={goal}
                    onExecute={handleExecuteGoal}
                    isExecuting={executingGoals.has(goal.id)}
                    executionProgress={executingGoals.has(goal.id) ? Math.random() * 100 : 0}
                    realMode={realMode}
                  />
                ) : (
                  /* List View */
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.priority === 'High' ? 'bg-red-100 text-red-700' :
                          goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {goal.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                          {goal.complexity}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{goal.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {goal.estimatedSetupTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot className="h-4 w-4" />
                          {goal.agentsRequired.length} agents
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {goal.roi}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExecuteGoal(goal)}
                      className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center gap-2 ${
                        realMode 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      {realMode ? '🚀 Execute Live' : '🎭 Demo Only'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Execution Modal */}
      <GoalExecutionModal
        goal={selectedGoal}
        isOpen={isExecutionModalOpen}
        onClose={handleCloseExecutionModal}
        realMode={realMode}
      />
    </div>
  );
};

export default AIGoalsPage;