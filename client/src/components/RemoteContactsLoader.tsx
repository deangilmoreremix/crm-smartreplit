// Remote Contacts Loader - Module Federation approach
import React, { Suspense } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';

interface RemoteContactsProps {
  remoteUrl: string | null; // URL of your deployed Bolt contacts app
  scope?: string; // Module federation scope (default: 'contacts_remote')
  module?: string; // Module path (default: './ContactsApp')
  onContactSelect?: (contact: any) => void;
  onContactCreate?: (contact: any) => void;
  onContactUpdate?: (contact: any) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: any[];
  theme?: 'light' | 'dark';
  fallbackComponent?: React.ComponentType<any>;
}

const RemoteContactsLoader: React.FC<RemoteContactsProps> = ({
  remoteUrl,
  scope = 'contacts_remote',
  module = './ContactsApp',
  fallbackComponent: FallbackComponent,
  ...contactProps
}) => {
  const { component: RemoteComponent, loading, error } = useRemoteComponent(
    remoteUrl,
    scope,
    module
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner message="Loading remote contacts..." size="lg" />
      </div>
    );
  }

  if (error) {
    console.warn('Remote contacts failed to load:', error);
    
    if (FallbackComponent) {
      return <FallbackComponent {...contactProps} />;
    }
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <h3 className="text-yellow-800 font-medium">Remote Contacts Unavailable</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Cannot connect to remote contacts app. Check the URL and try again.
        </p>
        <details className="mt-2">
          <summary className="text-yellow-600 text-xs cursor-pointer">Technical Details</summary>
          <pre className="text-xs text-yellow-600 mt-1 whitespace-pre-wrap">{error.message}</pre>
        </details>
      </div>
    );
  }

  if (!RemoteComponent) {
    if (FallbackComponent) {
      return <FallbackComponent {...contactProps} />;
    }
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Remote component not available</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Initializing contacts..." size="lg" />}>
      <RemoteComponent {...contactProps} />
    </Suspense>
  );
};

export default RemoteContactsLoader;