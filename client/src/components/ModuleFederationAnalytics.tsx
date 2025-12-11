import React, { useState, useEffect, Suspense } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';

// Fallback iframe component
const AnalyticsFallback: React.FC = () => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('✅ Analytics iframe loaded');
      try {
        iframe.contentWindow?.postMessage({
          type: 'SET_THEME',
          theme: 'light',
          mode: 'light'
        }, '*');
      } catch (err) {
        console.log('Could not send theme message to iframe');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <iframe
        ref={iframeRef}
        src="https://ai-analytics.smartcrm.vip?theme=light&mode=light"
        className="flex-1 w-full border-0"
        title="AI-Powered Analytics Dashboard"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        allowFullScreen
        loading="lazy"
        onError={(e) => {
          console.error('iframe failed to load:', e);
        }}
      />
    </div>
  );
};

// Error boundary to catch rendering errors
class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ AnalyticsApp rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('❌ Remote analytics component failed to render, using iframe fallback');
      return <AnalyticsFallback />;
    }

    return this.props.children;
  }
}

const AnalyticsApp: React.FC = () => {
  const [RemoteAnalytics, setRemoteAnalytics] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 Loading Module Federation Analytics...');
        const module = await loadRemoteComponent(
          'https://ai-analytics.smartcrm.vip',
          'AnalyticsApp',
          './AnalyticsApp'
        );
        
        // Validate that we got a valid component
        if (typeof module === 'function' || (typeof module === 'object' && module?.$$typeof)) {
          setRemoteAnalytics(() => module);
          console.log('✅ Module Federation Analytics loaded successfully');
        } else {
          throw new Error('Invalid module format received');
        }
      } catch (err) {
        console.warn('❌ Module Federation failed, using iframe fallback:', err);
        setError(err instanceof Error ? err.message : String(err));
        setRemoteAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRemote();
  }, []);

  // Always show fallback if there's an error or no component loaded
  if (error || !RemoteAnalytics) {
    return <AnalyticsFallback />;
  }

  // Wrap remote component with error boundary to catch rendering errors
  return (
    <AnalyticsErrorBoundary>
      <Suspense fallback={<AnalyticsFallback />}>
        <RemoteAnalytics />
      </Suspense>
    </AnalyticsErrorBoundary>
  );
};

interface ModuleFederationAnalyticsProps {
  showHeader?: boolean;
}

const ModuleFederationAnalytics: React.FC<ModuleFederationAnalyticsProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Analytics</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Module Federation
            </div>
          </div>
        </div>
      )}
      <div className="flex-1">
        <AnalyticsApp />
      </div>
    </div>
  );
};

export default ModuleFederationAnalytics;