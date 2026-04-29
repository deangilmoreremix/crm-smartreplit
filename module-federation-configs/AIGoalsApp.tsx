import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import AIGoalsDashboard from './components/AIGoalsDashboard';

interface AIGoalsAppProps {
  sharedData?: {
    user?: any;
    isAuthenticated?: boolean;
  };
}

const AIGoalsApp: React.FC<AIGoalsAppProps> = ({ sharedData }) => {
  return (
    <ThemeProvider>
      <div className="w-full h-full bg-white dark:bg-gray-900">
        <AIGoalsDashboard sharedData={sharedData} />
      </div>
    </ThemeProvider>
  );
};

export default AIGoalsApp;
