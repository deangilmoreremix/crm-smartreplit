import React, { useState, useEffect } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import { moduleFederationOrchestrator, useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const PipelineApp: React.FC = () => {
  const [RemotePipeline, setRemotePipeline] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        console.log('🚀 Attempting Module Federation for Pipeline...');
        
        // Try Module Federation first
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Module Federation timeout - remote app may need MF configuration')), 3000);
        });
        
        const modulePromise = loadRemoteComponent(
          'https://cheery-syrniki-b5b6ca.netlify.app',
          'PipelineApp',
          './PipelineApp'
        );
        
        const module = await Promise.race([modulePromise, timeoutPromise]);
        const PipelineComponent = (module as any).default || module;
        setRemotePipeline(() => PipelineComponent);
        
        // Register with orchestrator for shared state management
        moduleFederationOrchestrator.registerModule('pipeline', PipelineComponent, {
          deals: []
        });
        
        console.log('✅ Module Federation Pipeline loaded successfully');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Pipeline Module...</p>
        </div>
      </div>
    );
  }

  if (error || !RemotePipeline) {
    // Fallback to iframe - remote app needs Module Federation configuration
    return (
      <iframe
        src="https://cheery-syrniki-b5b6ca.netlify.app?theme=light&mode=light"
        className="w-full h-full border-0"
        title="Remote Pipeline System"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
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
  
  return React.createElement(RemotePipeline as any, { 
    theme: "light", 
    mode: "light",
    sharedData,
    onDataUpdate: (data: any) => {
      moduleFederationOrchestrator.broadcastToAllModules('PIPELINE_DATA_UPDATE', data);
    }
  });
};

interface ModuleFederationPipelineProps {
  showHeader?: boolean;
}

const ModuleFederationPipeline: React.FC<ModuleFederationPipelineProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full w-full flex flex-col" data-testid="kanban-board">
      {showHeader && (
        <div className="flex items-center justify-between p-2 mt-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pipeline Deals</h3>
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
        <PipelineApp />
      </div>
    </div>
  );
};

export default ModuleFederationPipeline;