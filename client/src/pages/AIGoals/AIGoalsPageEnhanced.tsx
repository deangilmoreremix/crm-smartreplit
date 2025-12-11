import React, { useState } from 'react';
import { Goal } from '../../types/goals';
import InteractiveGoalExplorer from '../../components/InteractiveGoalExplorer';
import GoalExecutionModal from '../../components/GoalExecutionModalExact';
import CustomizeButtonsModal from '../../components/ai/CustomizeButtonsModal';
import { aiGoalsData } from '../../data/goalsData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Brain, Info, Lightbulb, ArrowLeft, Sparkles, Zap, Target, Users, BarChart3, Bot, Activity, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAITools } from '../../components/AIToolsProvider';

// Define context type
interface AIGoalContext {
  type: 'contact' | 'deal' | 'company';
  name?: string;
  title?: string;
  id?: string;
}

const AIGoalsPageEnhanced: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [realMode, setRealMode] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
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

  const handleGoalComplete = (results: any) => {
    console.log('Goal completed:', selectedGoal?.title, results);
    setShowExecutionModal(false);
    setSelectedGoal(null);
  };

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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <div className="font-semibold">Live AI System</div>
                  <div className="text-xs">Ready to execute</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCustomizeModal(true)}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
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
            
            {/* Mode Toggle with Enhanced UX */}
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

      {/* Enhanced System Overview */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-indigo-100 dark:border-indigo-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100">
                    How AI Goals Work
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  Each goal triggers a specialized AI agent team that executes real business actions. 
                  Watch as multiple agents collaborate to achieve measurable outcomes in your CRM.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl border border-indigo-100 dark:border-indigo-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-semibold text-indigo-900 dark:text-indigo-100">Set Goals</span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Choose from 58+ pre-built business objectives
                    </p>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl border border-indigo-100 dark:border-indigo-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-indigo-900 dark:text-indigo-100">AI Agents</span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Multi-agent teams coordinate execution
                    </p>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl border border-indigo-100 dark:border-indigo-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-indigo-900 dark:text-indigo-100">Measure Results</span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Track real business impact and ROI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live System Status */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      System Status
                    </h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">AI Agents</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">17 Active</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Available Goals</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">58+</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Categories</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">8 Types</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700/50">
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Success Rate</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">98.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interactive Goal Explorer */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8">
            <InteractiveGoalExplorer 
              realMode={realMode}
              onModeToggle={(mode) => setRealMode(mode)}
              onOpenApiSetup={() => setShowApiSetup(true)}
              onGoalSelected={handleGoalSelected}
              contextData={context}
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
          realMode={realMode}
          onComplete={handleGoalComplete}
        />
      )}

      {/* Customize Buttons Modal */}
      {showCustomizeModal && (
        <CustomizeButtonsModal
          isOpen={showCustomizeModal}
          onClose={() => setShowCustomizeModal(false)}
          initialLocation="aiGoalsPage"
        />
      )}
    </div>
  );
};

export default AIGoalsPageEnhanced;