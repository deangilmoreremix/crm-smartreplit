import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const RemoteBusinessIntelLoader: React.FC = () => {
  const { isDark } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Try to communicate with the iframe to set light mode and add padding
      try {
        iframe.contentWindow?.postMessage({ 
          type: 'SET_THEME', 
          theme: 'light' 
        }, '*');
        
        // Add padding to prevent navbar overlap
        iframe.contentWindow?.postMessage({
          type: 'ADD_TOP_PADDING',
          padding: '80px'
        }, '*');
        
        // Try to inject CSS directly if postMessage doesn't work
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              const style = iframeDoc.createElement('style');
              style.textContent = `
                body { 
                  padding-top: 80px !important; 
                  margin-top: 0 !important;
                }
                .navbar, .header, nav, [class*="nav"], [class*="header"] {
                  z-index: 999 !important;
                }
                .main-content, .content, main, [class*="main"], [class*="content"] {
                  margin-top: 80px !important;
                  padding-top: 20px !important;
                }
              `;
              iframeDoc.head?.appendChild(style);
            }
          } catch (cssError) {
            console.log('Unable to inject CSS directly into iframe');
          }
        }, 1000);
        
      } catch (error) {
        console.log('Unable to communicate with iframe for theme setting and padding');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="w-full h-full bg-white" style={{ paddingTop: '80px' }} data-testid="business-intel">
      <iframe
        ref={iframeRef}
        src="https://ai-analytics.smartcrm.vip?theme=light&mode=light"
        className="w-full border-0"
        style={{ 
          height: 'calc(100vh - 80px)',
          minHeight: 'calc(100vh - 80px)'
        }}
        title="AI-Powered Analytics Dashboard"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default RemoteBusinessIntelLoader;