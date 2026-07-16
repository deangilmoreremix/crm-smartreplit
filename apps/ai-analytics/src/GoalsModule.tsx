// Goals Module for Module Federation
import React from 'react';
import AIGoalsApp from './AIGoalsApp';

interface GoalsModuleProps {
  sharedData?: {
    user?: any;
    isAuthenticated?: boolean;
  };
}

const GoalsModule: React.FC<GoalsModuleProps> = ({ sharedData }) => {
  return <AIGoalsApp sharedData={sharedData} />;
};

export default GoalsModule;
