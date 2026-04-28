import React, { Suspense } from 'react';
import {
  moduleFederationOrchestrator,
  useSharedModuleState,
} from '../utils/moduleFederationOrchestrator';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const CONTACTS_REMOTE_URL = 'https://contacts.smartcrm.vip';
const CONTACTS_SCOPE = 'contacts_app';
const CONTACTS_MODULE = './ContactsApp';

// Only import remote modules if MFE is enabled
let RemoteContactsApp: React.ComponentType<any>;

if (ENABLE_MFE) {
  // Will use dynamic loading via useRemoteComponent hook
  RemoteContactsApp = () => null; // Placeholder, actual loading handled in component
} else {
  RemoteContactsApp = LocalContactsFallback;
}

// Local fallback component when Module Federation is not available
const LocalContactsFallback: React.FC = () => {
  const dummyContacts = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      company: 'TechCorp Inc',
      status: 'active',
      value: 150000,
      lastContact: '2024-04-15',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@startup.io',
      company: 'StartupXYZ',
      status: 'lead',
      value: 85000,
      lastContact: '2024-04-10',
    },
    {
      id: 3,
      name: 'Mike Williams',
      email: 'mike@localbiz.com',
      company: 'LocalBusiness LLC',
      status: 'prospect',
      value: 25000,
      lastContact: '2024-04-08',
    },
  ];

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Add Contact
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Last Contact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dummyContacts.map((contact) => (
              <tr
                key={contact.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {contact.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {contact.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {contact.company}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      contact.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : contact.status === 'lead'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  ${contact.value.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(contact.lastContact).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ModuleFederationContactsContainer: React.FC<ModuleFederationContactsProps> = ({
  showHeader = false,
}) => {
  const {
    component: RemoteContactsApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? CONTACTS_REMOTE_URL : null, CONTACTS_SCOPE, CONTACTS_MODULE);

  if (!ENABLE_MFE || error) {
    return <LocalContactsFallback />;
  }

  if (loading || !RemoteContactsApp) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Contacts Module...</p>
        </div>
      </div>
    );
  }

  const ContactsApp = RemoteContactsApp as React.ComponentType<any>;

  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
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
      <div className="flex-1 overflow-auto">
        <ContactsApp />
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

const ModuleFederationContacts: React.FC = () => {
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

const ModuleFederationContactsContainer: React.FC<ModuleFederationContactsProps> = ({
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

export default ModuleFederationContactsContainer;
