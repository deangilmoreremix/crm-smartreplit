import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { moduleFederationOrchestrator } from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Only import remote modules if MFE is enabled
let RemotePipelineApp: React.ComponentType<any>;

if (ENABLE_MFE) {
  RemotePipelineApp = lazy(() =>
    import('PipelineApp/PipelineApp').catch(() => ({
      default: LocalPipelineFallback,
    }))
  );
} else {
  RemotePipelineApp = LocalPipelineFallback;
}

// Local fallback component when Module Federation is not available
const LocalPipelineFallback: React.FC = () => {
  const dummyDeals = [
    {
      id: 1,
      title: 'Enterprise Software Deal',
      company: 'TechCorp Inc',
      value: 150000,
      stage: 'proposal',
      probability: 75,
    },
    {
      id: 2,
      title: 'Cloud Migration Project',
      company: 'StartupXYZ',
      value: 85000,
      stage: 'negotiation',
      probability: 90,
    },
    {
      id: 3,
      title: 'Consulting Services',
      company: 'LocalBusiness LLC',
      value: 25000,
      stage: 'qualification',
      probability: 45,
    },
  ];

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Pipeline</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your deals and sales pipeline (Local Fallback)
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pipeline Overview</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Probability
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {dummyDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {deal.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deal.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${deal.value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deal.stage === 'negotiation'
                          ? 'bg-green-100 text-green-800'
                          : deal.stage === 'proposal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deal.probability}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Showing {dummyDeals.length} sample deals
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Total Value: ${dummyDeals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Module Federation Disabled
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                This is a local fallback interface. Enable Module Federation in your environment to
                load the full remote Pipeline application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PipelineApp: React.FC = () => {
  if (!ENABLE_MFE) {
    return <LocalPipelineFallback />;
  }

  return (
    <ErrorBoundary fallback={<LocalPipelineFallback />}>
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
    </ErrorBoundary>
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
