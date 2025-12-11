import React, { useState, useEffect } from 'react';
import { Code2, Power } from 'lucide-react';

export const DevBypassButton: React.FC = () => {
  const [isDev, setIsDev] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Check if we're in development environment
    const hostname = window.location.hostname;
    console.log('🔧 DevBypassButton: Current hostname:', hostname);
    
    const isDevelopmentEnvironment = (
      hostname.includes('localhost') || 
      hostname.includes('replit.dev')
    ) && !hostname.includes('replit.app');
    
    console.log('🔧 DevBypassButton: Is dev environment?', isDevelopmentEnvironment);
    setIsDev(isDevelopmentEnvironment);
    
    // Check if dev mode is currently enabled
    const devModeEnabled = localStorage.getItem('smartcrm-dev-mode') === 'true';
    console.log('🔧 DevBypassButton: Dev mode currently enabled?', devModeEnabled);
    setIsDevMode(devModeEnabled);
  }, []);

  const toggleDevMode = () => {
    console.log('🔧 DevBypassButton: Toggle clicked');
    if (!isDev) {
      console.log('🔧 DevBypassButton: Not in dev environment, ignoring');
      return;
    }

    if (isDevMode) {
      // Disable dev mode
      console.log('🔧 DevBypassButton: Disabling dev mode');
      localStorage.removeItem('smartcrm-dev-mode');
      localStorage.removeItem('dev-user-session');
      localStorage.removeItem('sb-supabase-auth-token');
      setIsDevMode(false);
      alert('Dev mode disabled. Refresh page to log in normally.');
    } else {
      // Enable dev mode
      console.log('🔧 DevBypassButton: Enabling dev mode');
      localStorage.setItem('smartcrm-dev-mode', 'true');
      setIsDevMode(true);
      alert('Dev mode enabled. Refreshing page...');
      window.location.reload();
    }
  };

  console.log('🔧 DevBypassButton: Rendering with isDev=', isDev, ', isDevMode=', isDevMode);

  if (!isDev) {
    console.log('🔧 DevBypassButton: Not in dev, returning null');
    return null;
  }

  return (
    <button
      onClick={toggleDevMode}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isDevMode
          ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30'
          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30'
      }`}
      title={isDevMode ? 'Dev mode enabled - click to disable' : 'Click to enable dev mode'}
      data-testid="button-dev-bypass"
    >
      <Code2 size={14} />
      <span>Dev</span>
      <Power size={12} className={isDevMode ? 'text-purple-400' : 'text-gray-400'} />
    </button>
  );
};

export default DevBypassButton;
