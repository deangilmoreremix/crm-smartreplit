import React, { Suspense, useState, useEffect } from 'react';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';
const USE_IFRAME_FALLBACK = import.meta.env.VITE_USE_IFRAME_FALLBACK !== 'false'; // Allow iframe fallback

// Remote configuration - Note: contacts.smartcrm.vip exposes 'ContactsApp'
const CONTACTS_REMOTE_URL = 'https://contacts.smartcrm.vip';
const CONTACTS_SCOPE = 'ContactsApp';
const CONTACTS_MODULE = './ContactsApp'; // Actual exposed module name

// Iframe fallback component - loads the contacts app directly
const ContactsIframeFallback: React.FC<{ showHeader?: boolean }> = ({ showHeader = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
        </div>
      )}
      <div className="flex-1 relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading Contacts...</p>
            </div>
          </div>
        )}
        <iframe
          src={`${CONTACTS_REMOTE_URL}?embedded=true`}
          className={`w-full h-full border-0 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          title="Remote Contacts Application"
          // Note: CSP on remote may block this - check headers
          style={{ minHeight: '500px' }}
        />
      </div>
    </div>
  );
};

// Local fallback for when both MFE and iframe fail
const LocalContactsFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Contacts Module Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The remote contacts application is currently unavailable. This may be due to:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 text-left mb-4 space-y-1">
          <li>• CSP header blocking iframe embedding</li>
          <li>• Network connectivity issues</li>
          <li>• Remote server maintenance</li>
          <li>• Module Federation configuration</li>
        </ul>
        <div className="space-y-2">
          <a
            href={CONTACTS_REMOTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
          >
            Open Contacts in New Tab
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

const ModuleFederationContactsContainer: React.FC<ModuleFederationContactsProps> = ({
  showHeader = false,
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [useIframe, setUseIframe] = React.useState(false);

  const {
    component: RemoteContactsApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? CONTACTS_REMOTE_URL : null, CONTACTS_SCOPE, CONTACTS_MODULE);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    if (useIframe) {
      window.location.reload();
    } else {
      setUseIframe(true);
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // If MFE is disabled, try iframe fallback or show local fallback
  if (!ENABLE_MFE) {
    if (USE_IFRAME_FALLBACK) {
      return <ContactsIframeFallback showHeader={showHeader} />;
    }
    return <LocalContactsFallback />;
  }

  // If MFE failed but we have iframe fallback enabled, use it
  if (error && USE_IFRAME_FALLBACK) {
    return <ContactsIframeFallback showHeader={showHeader} />;
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
            Contacts Module Failed to Load
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Error: {error.message || 'Unknown error occurred'}
          </p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

  if (loading || !RemoteContactsApp) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          <p className="text-xs text-gray-500 mt-2">Initializing remote application</p>
        </div>
      </div>
    );
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  const ContactsApp = RemoteContactsApp as React.ComponentType<any>;

  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <ContactsApp sharedData={sharedData} />
      </div>
    </div>
  );
};

interface ModuleFederationContactsProps {
  showHeader?: boolean;
}

export default ModuleFederationContactsContainer;
