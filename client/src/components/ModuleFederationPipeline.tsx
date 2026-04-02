import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

// Local fallback component when Module Federation is not available
const LocalPipelineFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Pipeline Module
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          The Pipeline module is currently unavailable.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
};

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';
const REMOTE_URL = 'https://cheery-syrniki-b5b6ca.netlify.app';
const REMOTE_SCOPE = 'PipelineApp';
const REMOTE_MODULE = './PipelineApp';

const PipelineApp: React.FC = () => {
  const [RemotePipeline, setRemotePipeline] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRemote = async () => {
      if (!ENABLE_MFE) {
        setError('MFE disabled');
        setIsLoading(false);
        return;
      }

      try {
        const Component = await loadRemoteComponent<React.ComponentType>(
          REMOTE_URL,
          REMOTE_SCOPE,
          REMOTE_MODULE
        );
        setRemotePipeline(() => Component);
        setIsLoading(false);
      } catch (err) {
        console.warn('Pipeline MF load failed, using fallback:', err);
        setError('Failed to load remote module');
        setIsLoading(false);
      }
    };

    loadRemote();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Pipeline Module...</p>
        </div>
      </div>
    );
  }

  if (error || !RemotePipeline) {
    return <LocalPipelineFallback />;
  }

  // Pass shared state and theme props to Module Federation component
  const sharedData = useSharedModuleState((state) => state.sharedData);

  return React.createElement(RemotePipeline as any, {
    theme: 'light',
    mode: 'light',
    sharedData,
    onDataUpdate: (data: any) => {
      moduleFederationOrchestrator.broadcastToAllModules('PIPELINE_DATA_UPDATE', data);
    },
  });
};

interface ModuleFederationPipelineProps {
  showHeader?: boolean;
}

const ModuleFederationPipeline: React.FC<ModuleFederationPipelineProps> = ({
  showHeader = false,
}) => {
  return (
    <div className="h-full w-full flex flex-col" data-testid="kanban-board">
      {showHeader && (
        <div className="flex items-center justify-between p-2 mt-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pipeline Deals</h3>
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
      <div className="flex-1 h-full">
        <PipelineApp />
      </div>
    </div>
  );
};

export default ModuleFederationPipeline;
