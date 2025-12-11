import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, X, Clock, Play, Pause } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AutoRefreshRemoteAppProps {
  src: string;
  title: string;
  className?: string;
  onClose?: () => void;
  defaultRefreshInterval?: number; // in seconds
  allowFullscreen?: boolean;
  sandbox?: string;
  allow?: string;
}

const AutoRefreshRemoteApp: React.FC<AutoRefreshRemoteAppProps> = ({
  src,
  title,
  className = 'w-full h-full',
  onClose,
  defaultRefreshInterval = 300, // 5 minutes default
  allowFullscreen = true,
  sandbox = "allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation",
  allow = "clipboard-read; clipboard-write; fullscreen; microphone; camera"
}) => {
  const { isDark } = useTheme();
  const [refreshInterval, setRefreshInterval] = useState(defaultRefreshInterval);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(refreshInterval);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const refreshApp = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      // Force refresh by temporarily changing src
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
      setLastRefreshed(Date.now());
      setTimeUntilRefresh(refreshInterval);
    }
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
    if (!isAutoRefreshEnabled) {
      setTimeUntilRefresh(refreshInterval);
    }
  };

  const updateRefreshInterval = (newInterval: number) => {
    setRefreshInterval(newInterval);
    setTimeUntilRefresh(newInterval);
  };

  // Auto refresh logic
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshApp();
      }, refreshInterval * 1000);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setTimeUntilRefresh(prev => {
          if (prev <= 1) {
            return refreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastRefreshed = () => {
    const now = Date.now();
    const diff = Math.floor((now - lastRefreshed) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control Header */}
      <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center space-x-4">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>

          {/* Auto-refresh controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isAutoRefreshEnabled 
                  ? 'bg-green-500 text-white' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }`}
              title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {isAutoRefreshEnabled ? <Pause size={12} /> : <Play size={12} />}
              <span>Auto</span>
            </button>

            {/* Refresh interval selector */}
            <select
              value={refreshInterval}
              onChange={(e) => updateRefreshInterval(Number(e.target.value))}
              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              disabled={isAutoRefreshEnabled}
            >
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
              <option value={600}>10m</option>
              <option value={1800}>30m</option>
            </select>

            {/* Countdown display */}
            {isAutoRefreshEnabled && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                <Clock size={12} />
                <span>{formatTime(timeUntilRefresh)}</span>
              </div>
            )}
          </div>

          {/* Last refreshed indicator */}
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Last: {formatLastRefreshed()}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshApp}
            className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            title="Refresh now"
          >
            <RefreshCw size={16} />
          </button>

          <button 
            onClick={() => window.open(src, '_blank')}
            className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Iframe container */}
      <div className="flex-1 p-2">
        <iframe
          ref={iframeRef}
          src={src}
          className={`rounded-xl border-0 w-full h-full ${className}`}
          title={title}
          frameBorder="0"
          allow={allow}
          sandbox={sandbox}
          allowFullScreen={allowFullscreen}
          style={{
            height: 'calc(100vh - 140px)',
            minHeight: '600px'
          }}
          onLoad={() => {
            setLastRefreshed(Date.now());
            try {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                  type: 'FULLSCREEN_MODE',
                  fullscreen: true
                }, '*');
              }
            } catch (error) {
              console.log('Could not communicate with iframe');
            }
          }}
        />
      </div>
    </div>
  );
};

export default AutoRefreshRemoteApp;