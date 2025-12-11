
import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { remoteAppManager } from '../utils/remoteAppManager';
import { useTheme } from '../contexts/ThemeContext';

const RemoteAppRefreshManager: React.FC = () => {
  const { isDark } = useTheme();
  const [activeRefreshCount, setActiveRefreshCount] = useState(0);
  const [isGlobalAutoRefresh, setIsGlobalAutoRefresh] = useState(true);
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const updateCount = () => {
      setActiveRefreshCount(remoteAppManager.getActiveRefreshCount());
    };

    // Update count every second
    const interval = setInterval(updateCount, 1000);
    
    // Listen for refresh events
    const handleRefresh = () => {
      setLastGlobalRefresh(new Date());
      updateCount();
    };

    window.addEventListener('remoteAppRefresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('remoteAppRefresh', handleRefresh);
    };
  }, []);

  const handleGlobalRefresh = () => {
    remoteAppManager.refreshAllApps();
    setLastGlobalRefresh(new Date());
  };

  const toggleGlobalAutoRefresh = () => {
    if (isGlobalAutoRefresh) {
      remoteAppManager.cleanup();
    } else {
      // This would need to be implemented based on which apps are currently loaded
      window.location.reload(); // Simple solution to restart all auto-refresh
    }
    setIsGlobalAutoRefresh(!isGlobalAutoRefresh);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-xl shadow-lg p-3`}>
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center space-x-2">
          {activeRefreshCount > 0 ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
            {activeRefreshCount} Active
          </span>
        </div>
        
        <button
          onClick={handleGlobalRefresh}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          title="Refresh all remote apps"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        
        <button
          onClick={toggleGlobalAutoRefresh}
          className={`p-2 rounded-lg transition-colors ${
            isGlobalAutoRefresh 
              ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
              : (isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600')
          }`}
          title={`${isGlobalAutoRefresh ? 'Disable' : 'Enable'} auto-refresh`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      {lastGlobalRefresh && (
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Last refresh: {lastGlobalRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default RemoteAppRefreshManager;
