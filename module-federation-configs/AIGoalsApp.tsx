// AIGoalsApp - Main entry point for Module Federation
// This component will be exposed by the agency app at https://agency.smartcrm.vip
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import AIGoalsDashboard from './components/AIGoalsDashboard';

const AIGoalsApp: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="w-full h-full bg-white dark:bg-gray-900">
        <AIGoalsDashboard />
      </div>
    </ThemeProvider>
  );
};

export default AIGoalsApp;
