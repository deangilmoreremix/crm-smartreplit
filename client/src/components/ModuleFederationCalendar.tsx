import React, { useState, useEffect, useRef } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';
import { moduleFederationOrchestrator, useSharedModuleState } from '../utils/moduleFederationOrchestrator';
import { useTheme } from '../contexts/ThemeContext';

const CalendarApp: React.FC = () => {
  const [RemoteCalendar, setRemoteCalendar] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const loadRemote = async () => {
      try {
        console.log('🚀 Loading Calendar via Module Federation...');
        console.log('📍 Remote URL: https://calendar.smartcrm.vip/remoteEntry.js');
        
        const modulePromise = loadRemoteComponent(
          'https://calendar.smartcrm.vip',
          'CalendarApp',
          './CalendarApp'
        );
        
        const module = await modulePromise;
        const CalendarComponent = (module as any).default || module;
        setRemoteCalendar(() => CalendarComponent);
        
        // Register with orchestrator for shared state management
        moduleFederationOrchestrator.registerModule('calendar', CalendarComponent, {
          appointments: []
        });
        
        console.log('✅ Module Federation Calendar loaded successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Module Federation failed:', err);
        console.log('📺 Falling back to iframe for Calendar...');
        setError((err as Error).message || 'Failed to load Module Federation calendar');
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    loadRemote();
  }, []);

  // Handle iframe communication
  useEffect(() => {
    if (!useFallback || !iframeRef.current) return;

    const iframe = iframeRef.current;

    const handleLoad = () => {
      // Try to communicate with the iframe to set light mode
      try {
        iframe.contentWindow?.postMessage({ 
          type: 'SET_THEME', 
          theme: 'light' 
        }, '*');
      } catch (error) {
        console.log('Unable to communicate with Calendar iframe for theme setting');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [useFallback]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Calendar Module...</p>
        </div>
      </div>
    );
  }

  // Use iframe fallback if Module Federation failed
  if (useFallback) {
    return (
      <div className="w-full h-full bg-white" data-testid="calendar-iframe-fallback">
        <iframe
          ref={iframeRef}
          src="https://calendar.smartcrm.vip"
          className="w-full h-full border-0"
          style={{ 
            width: '100%',
            height: '100%',
            minHeight: '600px'
          }}
          title="AI Calendar"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (error && !useFallback) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Unable to Load Calendar
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The calendar module could not be loaded. Please try again later.
          </p>
          
          {error && (
            <details className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">Technical Details</summary>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="text-red-600 dark:text-red-400"><strong>Error:</strong> {error}</p>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Pass shared state and theme props to Module Federation component
  const sharedData = useSharedModuleState(state => state.sharedData);
  
  return React.createElement(RemoteCalendar as any, { 
    theme: "light", 
    mode: "light",
    sharedData,
    onDataUpdate: (data: any) => {
      moduleFederationOrchestrator.broadcastToAllModules('CALENDAR_DATA_UPDATE', data);
    }
  });
};

interface ModuleFederationCalendarProps {
  showHeader?: boolean;
}

const ModuleFederationCalendar: React.FC<ModuleFederationCalendarProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full w-full flex flex-col" style={{ margin: 0, padding: 0 }} data-testid="calendar-month">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Calendar</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Loaded
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 w-full h-full" style={{ margin: 0, padding: 0 }}>
        <CalendarApp />
      </div>
    </div>
  );
};

export default ModuleFederationCalendar;
