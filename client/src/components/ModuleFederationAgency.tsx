import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';
const REMOTE_URL = 'https://agency.smartcrm.vip';
const REMOTE_SCOPE = 'AgencyApp';
const REMOTE_MODULE = './AIAgencyApp';

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
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          The AI Agency module is currently unavailable.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
};

const AgencyApp: React.FC = () => {
  const [RemoteAgency, setRemoteAgency] = useState<React.ComponentType | null>(null);
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
        setRemoteAgency(() => Component);
        setIsLoading(false);
      } catch (err) {
        console.warn('Agency MF load failed, using fallback:', err);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Agency Suite...</p>
        </div>
      </div>
    );
  }

  if (error || !RemoteAgency) {
    return <LocalAgencyFallback />;
  }

  return React.createElement(RemoteAgency as any, { theme: 'light', mode: 'light' });
};

const ModuleFederationAgency: React.FC = () => {
  return (
    <div className="h-full w-full">
      <AgencyApp />
    </div>
  );
};

export default ModuleFederationAgency;
