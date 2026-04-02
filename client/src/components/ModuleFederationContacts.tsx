import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';
const REMOTE_URL = 'https://contacts.smartcrm.vip';
const REMOTE_SCOPE = 'ContactsApp';
const REMOTE_MODULE = './ContactsApp';

// Local fallback component when Module Federation is not available
const LocalContactsFallback: React.FC = () => {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Contacts Module
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          The Contacts module is currently unavailable.
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

const ContactsApp: React.FC = () => {
  const [RemoteContacts, setRemoteContacts] = useState<React.ComponentType | null>(null);
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
        setRemoteContacts(() => Component);
        setIsLoading(false);
      } catch (err) {
        console.warn('Contacts MF load failed, using fallback:', err);
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
          <p className="text-gray-600">Loading Contacts Module...</p>
        </div>
      </div>
    );
  }

  if (error || !RemoteContacts) {
    return <LocalContactsFallback />;
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  return React.createElement(RemoteContacts as any, { theme: 'light', mode: 'light', sharedData });
};

interface ModuleFederationContactsProps {
  showHeader?: boolean;
}

const ModuleFederationContacts: React.FC<ModuleFederationContactsProps> = ({
  showHeader = false,
}) => {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ margin: 0, padding: 0 }}
      data-testid="contacts-list"
    >
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Enhanced Contacts</h3>
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
      <div className="flex-1 w-full h-full" style={{ margin: 0, padding: 0 }}>
        <ContactsApp />
      </div>
    </div>
  );
};

export default ModuleFederationContacts;
