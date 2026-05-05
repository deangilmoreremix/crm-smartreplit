import React, { Suspense } from 'react';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import { useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const ANALYTICS_REMOTE_URL = 'https://ai-analytics.smartcrm.vip';
const ANALYTICS_SCOPE = 'AnalyticsApp';
const ANALYTICS_MODULE = './AnalyticsApp';

// Local fallback component
const LocalAnalyticsFallback: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analytics Module Unavailable</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Module Federation is disabled or remote module failed to load
          </p>
        </div>
      </div>
    </div>
  );
};

interface ModuleFederationAnalyticsProps {
  showHeader?: boolean;
}

const ModuleFederationAnalytics: React.FC<ModuleFederationAnalyticsProps> = ({
  showHeader = false,
}) => {
  const {
    component: RemoteAnalyticsApp,
    loading,
    error,
  } = useRemoteComponent(
    ENABLE_MFE ? ANALYTICS_REMOTE_URL : null,
    ANALYTICS_SCOPE,
    ANALYTICS_MODULE
  );

  if (!ENABLE_MFE || error) {
    return <LocalAnalyticsFallback />;
  }

  if (loading || !RemoteAnalyticsApp) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Analytics Module...</p>
        </div>
      </div>
    );
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  const AnalyticsApp = RemoteAnalyticsApp as React.ComponentType<any>;

  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Analytics</h3>
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
        <AnalyticsApp sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationAnalytics;
