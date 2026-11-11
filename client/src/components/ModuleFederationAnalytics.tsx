import React, { Suspense } from 'react';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import { useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const ANALYTICS_REMOTE_URL = 'https://ai-analytics.smartcrm.vip';
const ANALYTICS_SCOPE = 'AnalyticsApp';
const ANALYTICS_MODULE = './AnalyticsApp';

// Diagnostics for federation debugging
if (import.meta.env.DEV) {
  console.log('🔍 Analytics Federation Config:', {
    url: ANALYTICS_REMOTE_URL,
    scope: ANALYTICS_SCOPE,
    module: ANALYTICS_MODULE
  });
}

// Fallback card shown when the remote is disabled or failed to load
const LocalAnalyticsFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
      <div className="max-w-md mx-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
        <p className="text-gray-900 dark:text-white font-semibold">Analytics Module Unavailable</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          The analytics module is disabled or failed to load.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => window.open(ANALYTICS_REMOTE_URL, '_blank', 'noopener,noreferrer')}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Open in new tab
          </button>
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
  // Hooks must run on every render, before any early return.
  const sharedData = useSharedModuleState((state) => state.sharedData);
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
    return <LocalAnalyticsFallback onRetry={() => window.location.reload()} />;
  }

  if (loading || !RemoteAnalyticsApp) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const AnalyticsApp = RemoteAnalyticsApp as React.ComponentType<any>;

  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Analytics</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <AnalyticsApp sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationAnalytics;
