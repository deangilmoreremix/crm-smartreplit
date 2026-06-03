import React, { useState, useCallback, useEffect } from 'react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  position: { x: number; y: number };
}

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
  onStepConnect?: (sourceId: string, targetId: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  steps,
  onStepClick,
  readOnly = false,
  className = '',
}) => {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const getStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'trigger':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'action':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'condition':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'running':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step.id);
    onStepClick?.(step);
  };

  const sortedSteps = [...steps].sort((a, b) => a.position.y - b.position.y);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 overflow-auto">
        <div className="min-w-full min-h-full p-8">
          <div className="relative">
            {sortedSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`
                    relative p-4 mb-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedStep === step.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                    ${getStatusColor(step.status)}
                    ${step.status === 'running' ? 'animate-pulse' : ''}
                  `}
                  style={{ 
                    marginLeft: step.position.x,
                    maxWidth: '280px',
                  }}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${step.status === 'completed' ? 'bg-green-200' : step.status === 'running' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                      {getStepIcon(step.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{step.name}</p>
                      <p className="text-xs opacity-75 capitalize">{step.status}</p>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    {index < sortedSteps.length - 1 && (
                      <div className="w-0.5 h-4 bg-gray-300"></div>
                    )}
                  </div>
                </div>

                {index < sortedSteps.length - 1 && (
                  <div 
                    className="absolute flex items-center"
                    style={{
                      left: step.position.x + 140,
                      top: step.position.y + 60,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No workflow steps</h3>
                <p className="text-gray-500">Add triggers and actions to build your workflow.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;