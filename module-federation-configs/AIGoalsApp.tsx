// Exposed AI Goals Component for Module Federation
// File: AIGoalsApp.tsx (for agency app)

import React, { useEffect, useState } from 'react';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  dueDate?: string;
}

interface AIGoalsAppProps {
  sharedData?: {
    user?: any;
    isAuthenticated?: boolean;
  };
}

const AIGoalsApp: React.FC<AIGoalsAppProps> = ({ sharedData }) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Launch New Product',
      description: 'Complete product launch strategy and marketing campaign',
      progress: 65,
      status: 'active',
      dueDate: '2024-06-15',
    },
    {
      id: '2',
      title: 'Team Expansion',
      description: 'Hire 3 new developers and 2 designers',
      progress: 40,
      status: 'active',
      dueDate: '2024-07-01',
    },
    {
      id: '3',
      title: 'Revenue Target Q2',
      description: 'Achieve $2M in quarterly revenue',
      progress: 78,
      status: 'active',
      dueDate: '2024-06-30',
    },
  ]);

  // Listen for messages from parent CRM
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CRM_GOALS_SYNC') {
        setGoals(event.data.goals || []);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that goals module is ready
    window.parent.postMessage(
      {
        type: 'AGENCY_MODULE_READY',
        source: 'REMOTE_AGENCY',
      },
      '*'
    );

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoalAction = (action: string, goal: Goal) => {
    // Notify parent CRM of goal actions
    window.parent.postMessage(
      {
        type: `GOAL_${action.toUpperCase()}`,
        data: goal,
        source: 'REMOTE_AGENCY',
      },
      '*'
    );
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Agency Goals</h1>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => handleGoalAction('select', goal)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{goal.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>
              {goal.dueDate && (
                <p className="text-xs text-gray-500">Due: {goal.dueDate}</p>
              )}
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No goals available</p>
            <button
              onClick={() =>
                handleGoalAction('create', {
                  id: Date.now().toString(),
                  title: 'New Goal',
                  description: 'Goal description',
                  progress: 0,
                  status: 'active',
                })
              }
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGoalsApp;
