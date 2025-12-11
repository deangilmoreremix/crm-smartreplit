import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const RemoteWLLoader: React.FC = () => {
  const { isDark } = useTheme(); // Use global theme context for consistency
  const currentTheme = isDark ? 'dark' : 'light';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const IFRAME_ORIGIN = 'https://moonlit-tarsier-239e70.netlify.app';
  const REMOTE_URL = 'https://moonlit-tarsier-239e70.netlify.app';

  // Handle iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsConnected(true);
      };

      const handleError = () => {
        setIsConnected(false);
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }
  }, []);

  // Handle messages from iframe - consistent with RemoteWhiteLabelLoader
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
          console.log('WL Iframe ready, theme will be sent by dedicated effect');
          break;
        case 'BUTTON_CLICK':
          console.log('Button clicked in WL iframe:', data);
          break;
        case 'NAVIGATION_REQUEST':
          if (data?.url && typeof data.url === 'string' && data.url.startsWith('/')) {
            window.location.href = data.url;
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Canonical theme sender - sends latest theme when it changes or when connected
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && isConnected) {
      iframe.contentWindow.postMessage({
        type: 'SET_THEME',
        theme: currentTheme
      }, IFRAME_ORIGIN);
    }
  }, [currentTheme, isConnected]);

  return (
    <div className={`w-full h-full transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <iframe
        ref={iframeRef}
        src={`${REMOTE_URL}?theme=${currentTheme}&mode=light&allowInteraction=true`}
        style={{
          width: '100%',
          height: '100vh',
          minHeight: '800px',
          border: 'none',
          display: 'block',
          overflow: 'auto',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          transition: 'background-color 0.3s ease'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; pointer-lock"
        allowFullScreen
        loading="lazy"
        title="White Label Platform"
        scrolling="yes"
        sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin allow-top-navigation"
      />
    </div>
  );
};

export default RemoteWLLoader;