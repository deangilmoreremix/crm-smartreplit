import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const PIPELINE_REMOTE_URL = 'https://pipeline.smartcrm.vip';
const PIPELINE_SCOPE = 'PipelineApp';
const PIPELINE_MODULE = './PipelineApp';

// Diagnostics for federation debugging
if (import.meta.env.DEV) {
  console.log('🔍 Pipeline Federation Config:', {
    url: PIPELINE_REMOTE_URL,
    scope: PIPELINE_SCOPE,
    module: PIPELINE_MODULE
  });
}

// Local fallback component
const LocalPipelineFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Pipeline Module Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The remote pipeline application is currently unavailable. This may be due to:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 text-left mb-4 space-y-1">
          <li>• Network connectivity issues</li>
          <li>• Remote server maintenance</li>
          <li>• CORS policy restrictions</li>
          <li>• Module Federation configuration</li>
        </ul>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
          <p className="text-xs text-gray-500">If this issue persists, contact support.</p>
        </div>
      </div>
    </div>
  );
};

interface ModuleFederationPipelineProps {
  showHeader?: boolean;
}

const ModuleFederationPipeline: React.FC<ModuleFederationPipelineProps> = ({
  showHeader = false,
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const {
    component: RemotePipelineApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? PIPELINE_REMOTE_URL : null, PIPELINE_SCOPE, PIPELINE_MODULE);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!ENABLE_MFE) {
    return <LocalPipelineFallback />;
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Pipeline Module Failed to Load
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Error: {error.message || 'Unknown error occurred'}
          </p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isRetrying ? 'Retrying...' : `Retry Connection (${retryCount}/3)`}
            </button>
            {retryCount >= 3 && (
              <p className="text-xs text-red-600">
                Maximum retries reached. Please contact support.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !RemotePipelineApp) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  const PipelineApp = RemotePipelineApp as React.ComponentType<any>;

  return (
    <div className="h-full w-full flex flex-col" data-testid="kanban-board">
      {showHeader && (
        <div className="flex items-center justify-between p-2 mt-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pipeline</h3>
        </div>
      )}
      <div className="flex-1 h-full">
        <PipelineApp sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationPipeline;
