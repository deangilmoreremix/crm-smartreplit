import React, { useEffect, useRef } from 'react';

const RemoteSmartCRMLoader: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Try to communicate with the iframe to set light mode
      try {
        iframe.contentWindow?.postMessage(
          {
            type: 'SET_THEME',
            theme: 'light',
          },
          '*'
        );
      } catch (error) {}
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="w-full h-full bg-white">
      <iframe
        ref={iframeRef}
        src="https://analytics.smartcrm.vip/"
        className="w-full h-full border-0"
        title="SmartCRM Closer Platform"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default RemoteSmartCRMLoader;
