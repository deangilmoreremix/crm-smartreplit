
import React, { useEffect, useRef } from 'react';
import { useRemoteAppUpdates } from '../utils/remoteAppManager';

interface AutoRefreshIframeProps {
  id: string;
  src: string;
  title: string;
  className?: string;
  refreshInterval?: number;
  onLoad?: (event: React.SyntheticEvent<HTMLIFrameElement>) => void;
  allow?: string;
  sandbox?: string;
}

const AutoRefreshIframe: React.FC<AutoRefreshIframeProps> = ({
  id,
  src,
  title,
  className = "w-full h-full border-0",
  refreshInterval = 30000,
  onLoad,
  allow = "clipboard-read; clipboard-write; fullscreen; microphone; camera",
  sandbox = "allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { refreshCount, lastUpdate } = useRemoteAppUpdates(
    id, 
    src, 
    true, // auto-refresh enabled
    refreshInterval
  );

  useEffect(() => {
    console.log(`Auto-refresh iframe ${id} initialized - Refresh count: ${refreshCount}`);
  }, [id, refreshCount]);

  const handleLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.log(`Auto-refresh iframe ${id} loaded at ${new Date().toLocaleTimeString()}`);
    
    // Call custom onLoad handler if provided
    if (onLoad) {
      onLoad(event);
    }
    
    // Send refresh notification to iframe content
    try {
      const iframe = event.target as HTMLIFrameElement;
      iframe.contentWindow?.postMessage({
        type: 'AUTO_REFRESH_ENABLED',
        interval: refreshInterval,
        lastUpdate: lastUpdate
      }, '*');
    } catch (error) {
      console.log('Could not communicate with iframe');
    }
  };

  return (
    <iframe
      id={id}
      ref={iframeRef}
      src={src}
      title={title}
      className={className}
      frameBorder="0"
      allow={allow}
      sandbox={sandbox}
      onLoad={handleLoad}
    />
  );
};

export default AutoRefreshIframe;
