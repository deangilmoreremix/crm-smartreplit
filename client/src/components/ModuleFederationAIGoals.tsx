import React, { Suspense } from 'react';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const AI_GOALS_REMOTE_URL = 'https://agency.smartcrm.vip';
const AI_GOALS_SCOPE = 'agency_app';
const AI_GOALS_MODULE = './AIGoalsApp';

const ModuleFederationAIGoals: React.FC<ModuleFederationAIGoalsProps> = ({
  showHeader = false,
}) => {
  const {
    component: RemoteAIGoalsApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? AI_GOALS_REMOTE_URL : null, AI_GOALS_SCOPE, AI_GOALS_MODULE);

  if (!ENABLE_MFE || error) {
    return <LocalAIGoalsFallback />;
  }

  if (loading || !RemoteAIGoalsApp) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading AI Goals Module...</p>
        </div>
      </div>
    );
  }

  const AIGoalsApp = RemoteAIGoalsApp as React.ComponentType<any>;

  return (
    <div className="w-full h-full">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Goals</h2>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Module Federation
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <AIGoalsApp />
      </div>
    </div>
  );
};

// Only import remote modules if MFE is enabled
let RemoteAIGoalsApp: React.ComponentType<any>;

if (ENABLE_MFE) {
  RemoteAIGoalsApp = lazy(() => import(/* @vite-ignore */ 'AIGoalsApp/AIGoalsApp'));
} else {
  RemoteAIGoalsApp = LocalAIGoalsFallback;
}

const AIGoalsApp: React.FC = () => {
  if (!ENABLE_MFE) {
    return <LocalAIGoalsFallback />;
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Goals Module...</p>
          </div>
        </div>
      }
    >
      <RemoteAIGoalsApp />
    </Suspense>
  );
};

interface ModuleFederationAIGoalsProps {
  showHeader?: boolean;
}

export default ModuleFederationAIGoals;
