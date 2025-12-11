import React, { useState } from 'react';
import InteractiveGoalCard from '@/components/InteractiveGoalCard';
import { Goal } from '@/types/goals';

const GoalCardDemo: React.FC = () => {
  const [executingGoal, setExecutingGoal] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Sample goals data
  const sampleGoals: Goal[] = [
    {
      id: '1',
      title: 'Automated Lead Scoring System',
      description: 'Implement an AI-powered lead scoring system that automatically evaluates and prioritizes incoming leads based on behavioral data, company profile, and engagement metrics.',
      businessImpact: 'Increase sales team efficiency by 40% and improve conversion rates by focusing on high-quality leads first.',
      priority: 'High',
      complexity: 'Advanced',
      category: 'Sales',
      agentsRequired: ['Lead Analyzer', 'Data Processor', 'CRM Integrator', 'Score Calculator'],
      toolsNeeded: ['CRM API', 'ML Pipeline', 'Webhook System', 'Analytics Dashboard'],
      estimatedSetupTime: '2-3 hours',
      roi: '250-400% within 6 months',
      realWorldExample: 'A SaaS company implemented this system and saw their sales team close 35% more deals by focusing only on leads scored above 75/100, while reducing time spent on unqualified prospects by 60%.',
      prerequisite: ['CRM system with API access', 'Lead tracking data (minimum 3 months)', 'Sales team buy-in and training'],
      successMetrics: ['Lead-to-opportunity conversion rate increase by 25%', 'Sales cycle reduction by 15%', 'Sales team productivity increase by 40%', 'Cost per acquisition reduction by 20%']
    },
    {
      id: '2',
      title: 'Smart Email Campaign Generator',
      description: 'Create personalized email campaigns using AI that adapts content, timing, and frequency based on recipient behavior and preferences.',
      businessImpact: 'Boost email engagement rates by 60% and reduce unsubscribe rates by 30% through hyper-personalization.',
      priority: 'Medium',
      complexity: 'Intermediate',
      category: 'Marketing',
      agentsRequired: ['Content Creator', 'Personalization Engine', 'Timing Optimizer'],
      toolsNeeded: ['Email Platform API', 'Customer Data Platform', 'A/B Testing Framework'],
      estimatedSetupTime: '1-2 hours',
      roi: '180-300% within 4 months',
      realWorldExample: 'An e-commerce brand increased their email revenue by 85% by using AI to personalize subject lines, product recommendations, and send times for each customer segment.',
      prerequisite: ['Email marketing platform', 'Customer behavioral data', 'Brand voice guidelines'],
      successMetrics: ['Open rate increase by 45%', 'Click-through rate increase by 60%', 'Revenue per email increase by 75%', 'Unsubscribe rate decrease by 30%']
    },
    {
      id: '3',
      title: 'Customer Health Monitoring',
      description: 'Monitor customer engagement and satisfaction in real-time to predict churn risk and trigger proactive retention campaigns.',
      businessImpact: 'Reduce customer churn by 45% and increase customer lifetime value by identifying at-risk customers early.',
      priority: 'High',
      complexity: 'Simple',
      category: 'Relationship',
      agentsRequired: ['Health Monitor', 'Risk Assessor', 'Alert System'],
      toolsNeeded: ['Customer Database', 'Engagement Tracker', 'Communication Platform'],
      estimatedSetupTime: '45 minutes',
      roi: '300-500% within 3 months',
      realWorldExample: 'A subscription service reduced churn from 12% to 7% monthly by identifying customers who decreased usage by 40% and automatically triggering personalized retention offers.',
      prerequisite: ['Customer usage data', 'Communication channels setup', 'Retention strategy framework'],
      successMetrics: ['Churn rate reduction by 45%', 'Customer lifetime value increase by 30%', 'Retention campaign success rate above 35%', 'Early warning accuracy of 85%+']
    }
  ];

  const handleExecuteGoal = (goal: Goal) => {
    setExecutingGoal(goal.id);
    setProgress(0);

    // Simulate execution progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExecutingGoal(null);
          return 0;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Goal Cards Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our AI-powered goal execution system. Each card represents a complete business automation goal with real-time metrics and interactive execution.
          </p>
        </div>

        {/* Toggle for Real Mode */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg border border-gray-200">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium">
              Demo Mode
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md font-medium">
              Real Mode
            </button>
          </div>
        </div>

        {/* Goal Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {sampleGoals.map((goal) => (
            <InteractiveGoalCard
              key={goal.id}
              goal={goal}
              onExecute={handleExecuteGoal}
              isExecuting={executingGoal === goal.id}
              executionProgress={executingGoal === goal.id ? progress : 0}
              realMode={false}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Select Goal</h3>
              <p className="text-gray-600 text-sm">Choose from pre-built automation goals or create custom ones tailored to your business needs.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Execution</h3>
              <p className="text-gray-600 text-sm">Our AI agents work together to implement the goal, handling integrations and configurations automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Track Results</h3>
              <p className="text-gray-600 text-sm">Monitor real-time metrics and ROI to measure the impact of your automation goals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalCardDemo;