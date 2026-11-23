import React from 'react';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import { useSharedModuleState } from '../utils/moduleFederationOrchestrator';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import RemoteAIGoalsLoader from './RemoteAIGoalsLoader';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration - deployed at agency.smartcrm.vip
const AGENCY_REMOTE_URL = 'https://agency.smartcrm.vip';
const AGENCY_SCOPE = 'AIGoalsApp';
const AGENCY_MODULE = './AgencyApp';

// Diagnostics for federation debugging
if (import.meta.env.DEV) {
  console.log('🔍 Agency Federation Config:', {
    url: AGENCY_REMOTE_URL,
    scope: AGENCY_SCOPE,
    module: AGENCY_MODULE
  });
}

interface ModuleFederationAgencyProps {
  showHeader?: boolean;
}

const ModuleFederationAgency: React.FC<ModuleFederationAgencyProps> = ({
  showHeader = false,
}) => {
  const { config } = useWhitelabel();
  const {
    component: RemoteAgencyApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? AGENCY_REMOTE_URL : null, AGENCY_SCOPE, AGENCY_MODULE);

  if (!ENABLE_MFE || error) {
    // Without Module Federation, embed the live Agency app (agency.smartcrm.vip) directly.
    return <RemoteAIGoalsLoader showHeader={false} />;
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{config.companyName} Agency</h2>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <AgencyApp sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationAgency;
