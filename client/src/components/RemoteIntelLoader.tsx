import React, { useRef, useEffect } from 'react';

const RemoteIntelLoader: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        iframe.contentWindow?.postMessage({ 
          type: 'SET_THEME', 
          theme: 'light' 
        }, '*');
      } catch (error) {
        console.log('Unable to communicate with Intel iframe');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="w-full h-screen bg-white" style={{ paddingTop: '64px' }}>
      <iframe
        ref={iframeRef}
        src="https://ai-analytics.smartcrm.vip"
        className="w-full border-0"
        style={{ 
          height: 'calc(100vh - 64px)',
          minHeight: 'calc(100vh - 64px)'
        }}
        title="Intel Dashboard"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        data-testid="intel-iframe"
      />
    </div>
  );
};

export default RemoteIntelLoader;