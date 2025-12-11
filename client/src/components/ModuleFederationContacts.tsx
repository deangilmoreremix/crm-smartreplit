import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import { moduleFederationOrchestrator, useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const ContactsApp: React.FC = () => {
  const [RemoteContacts, setRemoteContacts] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        console.log('🚀 Attempting Module Federation for Contacts...');
        
        // Try Module Federation first
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Module Federation timeout - remote app may need MF configuration')), 3000);
        });
        
        const modulePromise = loadRemoteComponent(
          'https://contacts.smartcrm.vip',
          'ContactsApp',
          './ContactsApp'
        );
        
        const module = await Promise.race([modulePromise, timeoutPromise]);
        const ContactsComponent = (module as any).default || module;
        setRemoteContacts(() => ContactsComponent);
        
        // Register with orchestrator for shared state management
        moduleFederationOrchestrator.registerModule('contacts', ContactsComponent, {
          contacts: []
        });
        
        console.log('✅ Module Federation Contacts loaded successfully');
        setIsLoading(false);
      } catch (err) {
        console.log('📺 Module Federation not available, using iframe fallback (remote app needs MF configuration)');
        setError('Remote app needs Module Federation configuration');
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
    // Fallback to iframe - remote app needs Module Federation configuration
    return (
      <iframe
        src="https://contacts.smartcrm.vip?theme=light&mode=light"
        className="w-full h-full border-0"
        style={{ width: '100%', height: '100%', border: 'none', margin: 0, padding: 0 }}
        title="Enhanced Contacts Module"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        loading="eager"
        onLoad={(e) => {
          // Send theme message to iframe
          const iframe = e.currentTarget;
          iframe.contentWindow?.postMessage({
            type: 'SET_THEME',
            theme: 'light',
            mode: 'light'
          }, '*');
        }}
      />
    );
  }

  // Pass shared state and theme props to Module Federation component
  const sharedData = useSharedModuleState(state => state.sharedData);
  
  return React.createElement(RemoteContacts as any, { 
    theme: "light", 
    mode: "light",
    sharedData,
    onDataUpdate: (data: any) => {
      moduleFederationOrchestrator.broadcastToAllModules('CONTACTS_DATA_UPDATE', data);
    }
  });
};

interface ModuleFederationContactsProps {
  showHeader?: boolean;
}

const ModuleFederationContacts: React.FC<ModuleFederationContactsProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full w-full flex flex-col" style={{ margin: 0, padding: 0 }} data-testid="contacts-list">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Enhanced Contacts</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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