import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

// Local fallback component when Module Federation is not available
const LocalPipelineFallback: React.FC = () => {
  const stages = [
    { id: 'lead', name: 'Lead', count: 12, color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'contact', name: 'Contact Made', count: 8, color: 'bg-blue-100 dark:bg-blue-900' },
    { id: 'qualified', name: 'Qualified', count: 5, color: 'bg-yellow-100 dark:bg-yellow-900' },
    { id: 'proposal', name: 'Proposal', count: 3, color: 'bg-purple-100 dark:bg-purple-900' },
    { id: 'closed', name: 'Closed Won', count: 2, color: 'bg-green-100 dark:bg-green-900' },
  ];

  const deals = [
    { id: 1, name: 'Acme Corp Deal', value: '$25,000', stage: 'qualified' },
    { id: 2, name: 'Tech Startup', value: '$50,000', stage: 'proposal' },
    { id: 3, name: 'Manufacturing Co', value: '$15,000', stage: 'contact' },
  ];

  return (
    <div className="w-full h-full p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Pipeline</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your sales opportunities (Local Fallback)
          </p>
        </div>

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stages.map((stage) => (
            <div key={stage.id} className={`${stage.color} p-4 rounded-lg`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {stage.name}
                </h3>
                <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded text-xs font-medium">
                  {stage.count}
                </span>
              </div>
              <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(stage.count / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Deals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Deals</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deal Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {deal.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deal.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {stages.find((s) => s.id === deal.stage)?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a local fallback implementation. The full pipeline module is being loaded
            remotely.
          </p>
        </div>
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
