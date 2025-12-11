// Remote White Label Suite Loader
import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useRemoteAppUpdates } from '../utils/remoteAppManager';
import { useTheme } from '../contexts/ThemeContext';

interface RemoteWhiteLabelLoaderProps {
  showHeader?: boolean;
}

const RemoteWhiteLabelLoader: React.FC<RemoteWhiteLabelLoaderProps> = ({
  showHeader = true // Show header by default to make theme toggle visible
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark, toggleTheme } = useTheme(); // Use global theme context
  const currentTheme = isDark ? 'dark' : 'light';

  const REMOTE_URL = 'https://moonlit-tarsier-239e70.netlify.app';
  const IFRAME_ID = 'wl-remote-iframe';
  const IFRAME_ORIGIN = 'https://moonlit-tarsier-239e70.netlify.app';

  const { manualRefresh, checkForUpdates, isChecking } = useRemoteAppUpdates(
    IFRAME_ID,
    REMOTE_URL,
    true // Enable auto-refresh
  );

  // Theme toggle uses global context - PostMessage will be handled by dedicated effect

  // Handle iframe load events - mounted once, not dependent on theme changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setError(null);
        setIsConnected(true);
        // Don't send theme here to avoid stale values - dedicated effect handles this
      };

      const handleError = () => {
        setError('Network error: Could not connect to the white label suite.');
        setIsConnected(false);
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }
  }, []); // Only mount once

  // Handle messages from iframe to fix button interaction issues - mounted once
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the iframe domain only
      if (event.origin !== IFRAME_ORIGIN) {
        return;
      }

      // Validate event data structure
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      const { type, data } = event.data;
      
      switch (type) {
        case 'IFRAME_READY':
          // Iframe is ready - the dedicated theme effect will handle sending current theme
          console.log('Iframe ready, theme will be sent by dedicated effect');
          break;
        case 'BUTTON_CLICK':
          // Handle button click events from iframe
          console.log('Button clicked in iframe:', data);
          break;
        case 'NAVIGATION_REQUEST':
          // Handle navigation requests from iframe (security check required)
          if (data?.url && typeof data.url === 'string' && data.url.startsWith('/')) {
            // Only allow relative URLs for security
            window.location.href = data.url;
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Only mount once

  // Canonical theme sender - always sends the latest theme when it changes or when connected
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && isConnected) {
      iframe.contentWindow.postMessage({
        type: 'SET_THEME',
        theme: currentTheme
      }, IFRAME_ORIGIN);
    }
  }, [currentTheme, isConnected]);

  const handleRefresh = () => {
    setError(null);
    manualRefresh();
    // Theme will be sent automatically by the dedicated effect when iframe reconnects
  };

  return (
    <div className="h-full w-full overflow-auto">
      {showHeader && (
        <div style={{ 
          backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#f8f9fa', 
          padding: '12px', 
          borderBottom: `1px solid ${currentTheme === 'dark' ? '#374151' : '#e2e8f0'}`,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isConnected ? '#10b981' : '#ef4444'
              }}>
                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: currentTheme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: currentTheme === 'dark' ? '#374151' : '#e5e7eb',
                  color: currentTheme === 'dark' ? '#e5e7eb' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {currentTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                {currentTheme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isChecking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isChecking ? 'not-allowed' : 'pointer',
                  opacity: isChecking ? 0.6 : 1
                }}
              >
                <RefreshCw size={12} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
                {isChecking ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <a
              href={REMOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '6px',
                fontSize: '12px',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={12} />
              Open in New Tab
            </a>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px',
          borderBottom: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}


      <iframe
        ref={iframeRef}
        id={IFRAME_ID}
        src={`${REMOTE_URL}?theme=${currentTheme}&mode=light&allowInteraction=true`}
        style={{
          width: '100%',
          height: showHeader ? 'calc(100vh - 60px)' : '100vh',
          minHeight: '800px',
          border: 'none',
          display: 'block',
          overflow: 'auto',
          backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          transition: 'background-color 0.3s ease'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; pointer-lock"
        allowFullScreen
        loading="lazy"
        title="White Label Management Suite"
        scrolling="yes"
        sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin allow-top-navigation"
      />
    </div>
  );
};

export default RemoteWhiteLabelLoader;