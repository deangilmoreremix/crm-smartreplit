import React, { lazy, Suspense } from 'react';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Lazy load the remote PipelineApp
const RemotePipelineApp = lazy(() => import('PipelineApp/PipelineApp'));

const PipelineApp: React.FC = () => {
  if (!ENABLE_MFE) {
    return <LocalPipelineFallback />;
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Pipeline Module...</p>
          </div>
        </div>
      }
    >
      <RemotePipelineApp
        theme="light"
        mode="light"
        onDataUpdate={(data: any) => {
          moduleFederationOrchestrator.broadcastToAllModules('PIPELINE_DATA_UPDATE', data);
        }}
      />
    </Suspense>
  );
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
