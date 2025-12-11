import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { 
  X, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Brain,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Settings,
  Cpu,
  Network,
  Bot,
  Eye,
  ArrowRight
} from 'lucide-react';

interface GoalExecutionModalProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  realMode: boolean;
  onComplete: (result: any) => void;
}

interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  agent: string;
  duration: string;
}

const GoalExecutionModal: React.FC<GoalExecutionModalProps> = ({
  goal,
  isOpen,
  onClose,
  realMode,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [agentThinking, setAgentThinking] = useState<string>('');
  const [executionResults, setExecutionResults] = useState<any>(null);

  // Initialize execution steps based on goal
  useEffect(() => {
    if (isOpen && goal) {
      const steps: ExecutionStep[] = [
        {
          id: '1',
          title: 'Initialize AI Agents',
          description: 'Setting up specialized agents for this goal',
          status: 'pending',
          progress: 0,
          agent: 'System Orchestrator',
          duration: '15s'
        },
        {
          id: '2',
          title: 'Data Collection',
          description: 'Gathering relevant CRM and external data',
          status: 'pending',
          progress: 0,
          agent: 'Data Analyst Agent',
          duration: '30s'
        },
        {
          id: '3',
          title: 'Strategy Development',
          description: 'AI agents developing execution strategy',
          status: 'pending',
          progress: 0,
          agent: 'Strategy Agent',
          duration: '45s'
        },
        {
          id: '4',
          title: 'Implementation',
          description: 'Executing the goal with real-time monitoring',
          status: 'pending',
          progress: 0,
          agent: 'Execution Agent',
          duration: '60s'
        },
        {
          id: '5',
          title: 'Results Analysis',
          description: 'Analyzing outcomes and generating insights',
          status: 'pending',
          progress: 0,
          agent: 'Analytics Agent',
          duration: '20s'
        }
      ];
      setExecutionSteps(steps);
      setCurrentStep(0);
      setExecutionProgress(0);
      setExecutionResults(null);
    }
  }, [isOpen, goal]);

  // Simulate execution process
  useEffect(() => {
    if (isExecuting && currentStep < executionSteps.length) {
      const step = executionSteps[currentStep];
      const interval = setInterval(() => {
        setExecutionSteps(prev => 
          prev.map((s, index) => 
            index === currentStep 
              ? { ...s, status: 'running', progress: Math.min(100, s.progress + Math.random() * 20 + 5) }
              : s
          )
        );

        // Update agent thinking
        const thinkingMessages = [
          `${step.agent} is analyzing ${goal.category.toLowerCase()} opportunities...`,
          `Processing CRM data and external signals...`,
          `Optimizing strategy based on ${goal.priority.toLowerCase()} priority...`,
          `Coordinating with ${goal.agentsRequired.length} specialized agents...`,
          `Implementing ${goal.complexity.toLowerCase()} complexity workflow...`
        ];
        setAgentThinking(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)]);

        // Check if step is complete
        if (executionSteps[currentStep]?.progress >= 100) {
          setExecutionSteps(prev => 
            prev.map((s, index) => 
              index === currentStep ? { ...s, status: 'completed', progress: 100 } : s
            )
          );
          setCurrentStep(prev => prev + 1);
        }
      }, realMode ? 1500 : 800);

      return () => clearInterval(interval);
    }

    // Complete execution
    if (currentStep >= executionSteps.length && isExecuting) {
      setIsExecuting(false);
      setExecutionResults({
        success: true,
        estimatedValue: `$${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}`,
        timeToComplete: `${Math.floor(Math.random() * 30 + 15)}m`,
        efficiency: `${Math.floor(Math.random() * 20 + 80)}%`,
        recommendations: [
          'Continue monitoring lead engagement metrics',
          'Expand successful automation to similar segments',
          'Schedule follow-up optimization in 2 weeks'
        ]
      });
    }
  }, [isExecuting, currentStep, executionSteps.length, realMode, goal]);

  const handleStartExecution = () => {
    setIsExecuting(true);
    setCurrentStep(0);
    setExecutionSteps(prev => 
      prev.map((step, index) => 
        index === 0 ? { ...step, status: 'running' } : { ...step, status: 'pending' }
      )
    );
  };

  const handlePauseExecution = () => {
    setIsExecuting(false);
  };

  const handleCompleteExecution = () => {
    onComplete(executionResults);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{goal.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {realMode ? 'Live Execution Mode' : 'Preview Mode'} • {goal.category} Goal
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Goal Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
                <Target className="h-5 w-5 mr-2" />
                Priority
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {goal.priority}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
                <TrendingUp className="h-5 w-5 mr-2" />
                Expected ROI
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {goal.roi}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center text-purple-600 dark:text-purple-400 mb-2">
                <Users className="h-5 w-5 mr-2" />
                AI Agents
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {goal.agentsRequired.length} Active
              </div>
            </div>
          </div>
        </div>

        {/* Agent Thinking Display */}
        {isExecuting && (
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center mb-2">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-medium text-blue-900 dark:text-blue-100">AI Agent Thinking</span>
                <div className="ml-auto flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {agentThinking}
              </p>
            </div>
          </div>
        )}

        {/* Execution Steps */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution Steps</h3>
          <div className="space-y-4">
            {executionSteps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50' :
                  step.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/50' :
                  step.status === 'error' ? 'bg-red-100 dark:bg-red-900/50' :
                  'bg-gray-100 dark:bg-slate-700'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : step.status === 'running' ? (
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : step.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">{step.title}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{step.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{step.description}</p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Agent: {step.agent}</span>
                    {step.status === 'running' && (
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {executionResults && (
          <div className="p-6 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution Results</h3>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700/50">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-semibold text-green-900 dark:text-green-100">Goal Executed Successfully</span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Value Generated</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{executionResults.estimatedValue}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time to Complete</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{executionResults.timeToComplete}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency Rating</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{executionResults.efficiency}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Recommendations:</div>
                <ul className="space-y-1">
                  {executionResults.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <ArrowRight className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
            
            <div className="flex space-x-3">
              {!isExecuting && !executionResults && (
                <button
                  onClick={handleStartExecution}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                    realMode 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                  }`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {realMode ? 'Execute Live' : 'Start Preview'}
                </button>
              )}
              
              {isExecuting && (
                <button
                  onClick={handlePauseExecution}
                  className="flex items-center px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </button>
              )}
              
              {executionResults && (
                <button
                  onClick={handleCompleteExecution}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalExecutionModal;