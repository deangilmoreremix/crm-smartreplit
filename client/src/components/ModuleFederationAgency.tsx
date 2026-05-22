import React from 'react';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import { useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration - agency.smartcrm.vip uses /assets/remoteEntry.js
const AGENCY_REMOTE_URL = 'https://agency.smartcrm.vip';
const AGENCY_SCOPE = 'AIGoalsApp';
const AGENCY_MODULE = './AIGoalsApp';

// Local fallback component when Module Federation is not available
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

interface ModuleFederationAgencyProps {
  showHeader?: boolean;
}

const ModuleFederationAgency: React.FC<ModuleFederationAgencyProps> = ({
  showHeader = false,
}) => {
  const {
    component: RemoteAgencyApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? AGENCY_REMOTE_URL : null, AGENCY_SCOPE, AGENCY_MODULE);

  if (!ENABLE_MFE || error) {
    return <LocalAgencyFallback />;
  }

  if (loading || !RemoteAgencyApp) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Agency...</p>
        </div>
      </div>
    );
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  const AgencyApp = RemoteAgencyApp as React.ComponentType<any>;

  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agency</h2>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <AgencyApp sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationAgency;
