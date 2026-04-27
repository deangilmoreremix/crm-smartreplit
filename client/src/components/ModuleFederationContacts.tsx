import React, { lazy, Suspense } from 'react';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Lazy load the remote ContactsApp
const RemoteContactsApp = lazy(() => import('ContactsApp/ContactsApp'));

// Local fallback component when Module Federation is not available
const LocalContactsFallback: React.FC = () => {
  const dummyContacts = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1 234 567 8902' },
  ];

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your contacts (Local Fallback)</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact List</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {dummyContacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {contact.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a local fallback implementation. The full contacts module is being loaded
            remotely.
          </p>
        </div>
      </div>
    </div>
  );
};

const ContactsApp: React.FC = () => {
  if (!ENABLE_MFE) {
    return <LocalContactsFallback />;
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Contacts Module...</p>
          </div>
        </div>
      }
    >
      <RemoteContactsApp theme="light" mode="light" />
    </Suspense>
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
