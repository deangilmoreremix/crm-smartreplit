import React from 'react';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Agency/AI Goals MFE is currently disabled because the remote app is not deployed
// This component shows a placeholder until the agency.smartcrm.vip remote is built
const LocalAIGoalsFallback: React.FC<ModuleFederationAIGoalsProps> = ({ showHeader = false }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI Goals & Agency Suite
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md">
          The AI Goals module is under development and will be available soon. This module will
          provide AI-powered goal setting, progress tracking, and automated workflows.
        </p>
        <div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
          Coming Soon
        </div>
      </div>
    </div>
  );
};

const ModuleFederationAIGoals: React.FC<ModuleFederationAIGoalsProps> = ({
  showHeader = false,
}) => {
  // Agency/AI Goals MFE is intentionally disabled until the remote app is deployed
  // Return fallback immediately without attempting remote load
  return <LocalAIGoalsFallback showHeader={showHeader} />;
};

export default ModuleFederationAIGoals;
