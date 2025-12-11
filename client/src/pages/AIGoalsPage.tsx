import React, { useState } from 'react';
import { Goal, AIGoalContext } from '../types/goals';
import InteractiveGoalExplorer from '../components/InteractiveGoalExplorer';
import GoalExecutionModal from '../components/GoalExecutionModal';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Brain, Info, ArrowLeft, Target, Users, BarChart3, Bot, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// AIGoalContext is now imported from types

const AIGoalsPage: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [realMode, setRealMode] = useState(false);
  
  const navigate = useNavigate();
  
  // Get context from session storage or URL params
  const [context] = useState<AIGoalContext | null>(() => {
    try {
      const savedContext = sessionStorage.getItem('currentEntityContext');
      return savedContext ? JSON.parse(savedContext) : null;
    } catch {
      return null;
    }
  });

  const handleGoalSelected = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowExecutionModal(true);
  };

  const handleModeToggle = (mode: boolean) => {
    setRealMode(mode);
  };

  const handleCloseModal = () => {
    setShowExecutionModal(false);
    setSelectedGoal(null);
  };

  const handleGoalComplete = (result: any) => {
    console.log('Goal execution completed:', result);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Massive Header Section */}
        <div className="text-center py-16 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm"></div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
                <Brain className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Goals Center
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform business objectives into automated AI workflows
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
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

            {/* How AI Goals Work Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">How AI Goals Work</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
                Each goal triggers a specialized AI agent team that executes real business actions. Watch as multiple agents collaborate to achieve measurable outcomes in your CRM.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-xl mb-4 mx-auto">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Set Goals</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose from 58+ pre-built business objectives</p>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-xl mb-4 mx-auto">
                    <Bot className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI Execution</h3>
                  <p className="text-gray-600 dark:text-gray-400">17 specialized agents work together automatically</p>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-xl mb-4 mx-auto">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Measure Results</h3>
                  <p className="text-gray-600 dark:text-gray-400">Track real business impact and ROI</p>
                </div>
              </div>
            </div>

            {/* System Status Dashboard */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">System Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">17</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI Agents</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Active</div>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">58+</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Available Goals</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Ready to execute</div>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-8 w-8 text-yellow-600" />
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">8</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Categories</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Types</div>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">98.5%</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Success Rate</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive AI Goal Explorer */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden">
            <InteractiveGoalExplorer
              realMode={realMode}
              onModeToggle={handleModeToggle}
              onGoalSelected={handleGoalSelected}
              contextData={context}
              className="p-8"
            />
          </div>
        </div>
      </div>

      {/* Goal Execution Modal */}
      {showExecutionModal && selectedGoal && (
        <GoalExecutionModal
          goal={selectedGoal}
          isOpen={showExecutionModal}
          onClose={handleCloseModal}
          onComplete={handleGoalComplete}
          realMode={realMode}
        />
      )}
    </div>
  );
};

export default AIGoalsPage;