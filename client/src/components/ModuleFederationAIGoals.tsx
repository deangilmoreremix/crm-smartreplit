import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';

const AIGoalsApp: React.FC = () => {
  const [RemoteAIGoals, setRemoteAIGoals] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        console.log('🚀 Loading Module Federation AI Goals...');
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Module Federation loading timeout')), 8000);
        });
        
        const modulePromise = loadRemoteComponent(
          'https://tubular-choux-2a9b3c.netlify.app',
          'AIGoalsApp',
          './AIGoalsApp'
        );
        
        const module = await Promise.race([modulePromise, timeoutPromise]);
        setRemoteAIGoals(() => (module as any).default || module);
        console.log('✅ Module Federation AI Goals loaded successfully');
      } catch (err) {
        console.warn('❌ Module Federation failed, using iframe fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    loadRemote();
  }, []);

  if (error || !RemoteAIGoals) {
    // Fallback to iframe
    return (
      <iframe
        src="https://tubular-choux-2a9b3c.netlify.app"
        className="w-full h-full border-0"
        title="Remote AI Goals System"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
      />
    );
  }

  return <RemoteAIGoals />;
};

interface ModuleFederationAIGoalsProps {
  showHeader?: boolean;
}

const ModuleFederationAIGoals: React.FC<ModuleFederationAIGoalsProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Goals Center</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Module Federation
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 h-full">
        <AIGoalsApp />
      </div>
    </div>
  );
};

export default ModuleFederationAIGoals;