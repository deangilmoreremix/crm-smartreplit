import React, { useEffect, useRef } from 'react';

const RemoteFunnelCraftLoader: React.FC = () => {
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
        src="https://agency.smartcrm.vip/"
        className="w-full h-full border-0"
        title="FunnelCraft AI Platform"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default RemoteFunnelCraftLoader;
