import React, { useState, useEffect } from 'react';
import { Goal, ExecutionStep } from '../types/goals';
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Brain,
  Zap,
  Eye,
  TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
// import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LiveGoalExecutionProps {
  goal: Goal;
  onComplete: (result: any) => void;
  onCancel: () => void;
  realMode?: boolean;
  autoStart?: boolean;
}

interface LiveMetrics {
  agentsActive: number;
  stepsCompleted: number;
  totalSteps: number;
  estimatedTimeRemaining: number;
  confidence: number;
  crmUpdates: number;
}

const LiveGoalExecution: React.FC<LiveGoalExecutionProps> = ({
  goal,
  onComplete,
  onCancel,
  realMode = false,
  autoStart = false
}) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    agentsActive: 0,
    stepsCompleted: 0,
    totalSteps: goal.agentsRequired.length,
    estimatedTimeRemaining: parseInt(goal.estimatedSetupTime.replace(/[^0-9]/g, '')) * 60 || 900,
    confidence: 85,
    crmUpdates: 0
  });
  const [thinking, setThinking] = useState('Initializing AI agents...');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initializeSteps();
  }, [goal]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        updateExecution();
      }, realMode ? 2000 : 500);

      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused, currentStep]);

  const initializeSteps = () => {
    const executionSteps: ExecutionStep[] = goal.agentsRequired.map((agent, index) => ({
      id: `step-${index}`,
      name: `${agent} Analysis`,
      status: 'pending',
      progress: 0,
      agent: agent,
      thinking: '',
      toolsUsed: goal.toolsNeeded.slice(0, 2),
      crmImpact: ''
    }));

    setSteps(executionSteps);
    setLiveMetrics(prev => ({ ...prev, totalSteps: executionSteps.length }));
  };

  const updateExecution = () => {
    if (currentStep >= steps.length) {
      completeExecution();
      return;
    }

    const step = steps[currentStep];
    
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const targetStep = newSteps[currentStep];
      
      if (targetStep.status === 'pending') {
        targetStep.status = 'executing';
        targetStep.progress = 0;
        setThinking(`${targetStep.agent} is analyzing ${goal.category} requirements...`);
        addLog(`🤖 ${targetStep.agent} started analysis`);
        
        setLiveMetrics(prev => ({
          ...prev,
          agentsActive: prev.agentsActive + 1
        }));
      } else if (targetStep.status === 'executing') {
        targetStep.progress = Math.min(100, targetStep.progress + (realMode ? 15 : 25));
        
        if (targetStep.progress >= 100) {
          targetStep.status = 'completed';
          targetStep.result = generateStepResult(targetStep, goal);
          targetStep.thinking = `Completed ${goal.category} optimization with ${(85 + Math.random() * 10).toFixed(1)}% confidence`;
          
          setLiveMetrics(prev => ({
            ...prev,
            agentsActive: prev.agentsActive - 1,
            stepsCompleted: prev.stepsCompleted + 1,
            confidence: Math.min(95, prev.confidence + 2),
            crmUpdates: prev.crmUpdates + (realMode ? 1 : 0)
          }));
          
          addLog(`✅ ${targetStep.agent} completed successfully`);
          setCurrentStep(prev => prev + 1);
        } else {
          const thinkingMessages = [
            `Processing ${goal.category} data patterns...`,
            `Analyzing ROI potential...`,
            `Optimizing ${goal.businessImpact}...`,
            `Evaluating success metrics...`,
            `Calculating implementation requirements...`
          ];
          setThinking(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)]);
        }
      }
      
      return newSteps;
    });

    // Update time remaining
    setLiveMetrics(prev => ({
      ...prev,
      estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - (realMode ? 10 : 5))
    }));
  };

  const generateStepResult = (step: ExecutionStep, goal: Goal) => {
    return {
      analysis: `${step.agent} completed ${goal.title} analysis`,
      insights: [
        `${goal.priority} priority optimization identified`,
        `${goal.complexity} implementation complexity confirmed`,
        `ROI potential: ${goal.roi}`
      ],
      recommendations: [
        `Implement ${goal.toolsNeeded[0]} integration`,
        `Monitor ${goal.successMetrics[0]}`,
        `Track ${goal.category} performance metrics`
      ],
      confidence: 85 + Math.random() * 10
    };
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-10));
  };

  const completeExecution = () => {
    setIsRunning(false);
    setThinking('Execution completed! Generating final report...');
    addLog('🎉 Goal execution completed successfully');
    
    setTimeout(() => {
      onComplete({
        success: true,
        results: {
          steps: steps,
          metrics: liveMetrics,
          insights: [
            `Goal "${goal.title}" executed successfully`,
            `${liveMetrics.stepsCompleted} agents completed analysis`,
            `Confidence level: ${liveMetrics.confidence}%`,
            `Estimated business impact: ${goal.businessImpact}`
          ]
        },
        executionTime: (parseInt(goal.estimatedSetupTime.replace(/[^0-9]/g, '')) * 60 - liveMetrics.estimatedTimeRemaining) * 1000
      });
    }, 1000);
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    addLog('🚀 Goal execution started');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    addLog(isPaused ? '▶️ Execution resumed' : '⏸️ Execution paused');
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    addLog('⏹️ Execution stopped by user');
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'executing':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Live Execution: {goal.title}
        </h3>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline">
              {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          <Button onClick={handleStop} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Active Agents</span>
            </div>
            <div className="text-2xl font-bold">{liveMetrics.agentsActive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold">
              {liveMetrics.stepsCompleted}/{liveMetrics.totalSteps}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Time Left</span>
            </div>
            <div className="text-2xl font-bold">
              {formatTime(liveMetrics.estimatedTimeRemaining)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <div className="text-2xl font-bold">{liveMetrics.confidence}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Thinking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Agent Thinking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 dark:text-gray-300 italic">{thinking}</span>
          </div>
        </CardContent>
      </Card>

      {/* Execution Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${step.progress}%` }}
                    ></div>
                  </div>
                  {step.thinking && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {step.thinking}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for execution to start...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
            {isRunning && (
              <div className="text-yellow-400 animate-pulse">
                ▶ Processing...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveGoalExecution;