import React from 'react';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Agency MFE is currently disabled because the remote app is not deployed
// This component shows a placeholder until the agency.smartcrm.vip remote is built
const LocalAgencyFallback: React.FC = () => {
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI Agency Suite
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md">
          The AI Agency module is under development and will be available soon. This module will
          provide AI-powered sales automation, lead scoring, and campaign management.
        </p>
        <div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
          Coming Soon
        </div>
      </div>
    </div>
  );
};

const ModuleFederationAgency: React.FC = () => {
  // Agency MFE is intentionally disabled until the remote app is deployed
  // Return fallback immediately without attempting remote load
  return <LocalAgencyFallback />;
};

export default ModuleFederationAgency;
