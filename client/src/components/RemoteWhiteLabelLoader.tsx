// Remote White Label Suite Loader
import React, { useState, useEffect, useContext } from 'react';
import { ExternalLink, RefreshCw, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { getOrigin, useRemoteEmbedStatus } from '../utils/remoteAppManager';
import RemoteEmbedFallback from './RemoteEmbedFallback';
import { useTheme } from '../contexts/ThemeContext';
import { EntitlementContext } from '../contexts/EntitlementContext';
import { canAccessFeature, FeatureKey } from '../types/entitlements';

export const WHITE_LABEL_REMOTE_URL: string =
  import.meta.env.VITE_WHITE_LABEL_REMOTE_URL || 'https://white-label.smartcrm.vip';
const REMOTE_URL = WHITE_LABEL_REMOTE_URL;
const IFRAME_ID = 'wl-remote-iframe';
const IFRAME_ORIGIN = getOrigin(REMOTE_URL);

interface RemoteWhiteLabelLoaderProps {
  showHeader?: boolean;
}

const RemoteWhiteLabelLoader: React.FC<RemoteWhiteLabelLoaderProps> = ({
  showHeader = true, // Show header by default to make theme toggle visible
}) => {
  const { isDark, toggleTheme } = useTheme(); // Use global theme context
  const currentTheme = isDark ? 'dark' : 'light';
  // Initial theme only: the iframe src must not change on toggle (that would reload the
  // editor and drop unsaved edits); later changes go through postMessage below.
  const [initialTheme] = useState(currentTheme);

  const { iframeRef, status, onLoad, retry, attempt } = useRemoteEmbedStatus(REMOTE_URL);
  const isLoaded = status === 'loaded' || status === 'unconfirmed' || status === 'confirmed';
  const iframeSrc = (() => {
    try {
      const u = new URL(REMOTE_URL);
      u.searchParams.set('theme', initialTheme);
      u.searchParams.set('mode', 'light');
      u.searchParams.set('allowInteraction', 'true');
      return u.toString();
    } catch {
      return `${REMOTE_URL}?theme=${initialTheme}&mode=light&allowInteraction=true`;
    }
  })();
  // NOTE: auto-refresh is intentionally NOT used here: this is an editing UI and a periodic
  // reload would wipe unsaved edits.

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
          break;
        case 'BUTTON_CLICK':
          // Handle button click events from iframe
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
    if (iframe?.contentWindow && isLoaded) {
      iframe.contentWindow.postMessage(
        {
          type: 'SET_THEME',
          theme: currentTheme,
        },
        IFRAME_ORIGIN
      );
    }
  }, [currentTheme, isLoaded, status]);

  const handleRefresh = () => {
    // Remounts the iframe with the same src (query params preserved) and resets status.
    retry();
  };

  const statusLabel =
    status === 'confirmed'
      ? 'Connected'
      : status === 'unconfirmed'
        ? 'Loaded (not confirmed)'
        : status === 'timeout'
          ? 'Unavailable'
          : 'Connecting...';
  const statusColor =
    status === 'confirmed' ? '#10b981' : status === 'timeout' ? '#ef4444' : '#9ca3af';

  return (
    <div className="h-full w-full overflow-auto">
      {showHeader && (
        <div
          style={{
            backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#f8f9fa',
            padding: '12px',
            borderBottom: `1px solid ${currentTheme === 'dark' ? '#374151' : '#e2e8f0'}`,
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: statusColor,
                }}
              >
                {status === 'confirmed' ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: currentTheme === 'dark' ? '#e5e7eb' : '#374151',
                  }}
                >
                  {statusLabel}
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
                  transition: 'all 0.3s ease',
                }}
              >
                {currentTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                {currentTheme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <button
                onClick={handleRefresh}
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
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} />
                Refresh
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
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              Open in New Tab
            </a>
          </div>
        </div>
      )}

      {status === 'timeout' && (
        <RemoteEmbedFallback title="White Label Suite" url={REMOTE_URL} onRetry={retry} />
      )}

      <iframe
        key={attempt}
        ref={iframeRef}
        id={IFRAME_ID}
        src={iframeSrc}
        onLoad={onLoad}
        style={{
          display: status === 'timeout' ? 'none' : 'block',
          width: '100%',
          height: showHeader ? 'calc(100vh - 60px)' : '100vh',
          minHeight: '800px',
          border: 'none',
          overflow: 'auto',
          backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          transition: 'background-color 0.3s ease',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; pointer-lock"
        allowFullScreen
        loading="lazy"
        title="White Label Management Suite"
        scrolling="yes"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
      />
    </div>
  );
};

/**
 * Dashboard embed gated on the same entitlement as the /white-label route
 * (FeatureKey.WHITE_LABEL_CUSTOMIZATION). Users without access get an upgrade card, not an iframe.
 */
export const GatedWhiteLabelSection: React.FC<RemoteWhiteLabelLoaderProps> = (props) => {
  const ctx = useContext(EntitlementContext);
  if (ctx?.isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400" data-testid="white-label-gate-loading">
        Checking access...
      </div>
    );
  }
  if (!canAccessFeature(ctx?.entitlement ?? null, FeatureKey.WHITE_LABEL_CUSTOMIZATION)) {
    return (
      <div className="p-6 flex items-center justify-center" data-testid="white-label-upgrade-card">
        <div className="max-w-md rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="font-semibold text-gray-900 dark:text-white">White Label Suite</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            White label customization is not included in your current plan.
          </p>
          <a
            href="/upgrade"
            className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Upgrade to unlock
          </a>
        </div>
      </div>
    );
  }
  return <RemoteWhiteLabelLoader {...props} />;
};

export default RemoteWhiteLabelLoader;
