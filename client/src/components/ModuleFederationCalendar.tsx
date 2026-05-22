import React, { Suspense } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useRemoteComponent } from '../utils/dynamicModuleFederation';
import { useSharedModuleState } from '../utils/moduleFederationOrchestrator';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Remote configuration
const CALENDAR_REMOTE_URL = 'https://calendar.smartcrm.vip';
const CALENDAR_SCOPE = 'CalendarApp';
const CALENDAR_MODULE = './CalendarApp';

// Local fallback component when Module Federation is not available
const LocalCalendarFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Calendar Module Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The remote calendar application is currently unavailable. This may be due to:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 text-left mb-4 space-y-1">
          <li>• Network connectivity issues</li>
          <li>• Remote server maintenance</li>
          <li>• CORS policy restrictions</li>
          <li>• Module Federation configuration</li>
        </ul>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
          <p className="text-xs text-gray-500">If this issue persists, contact support.</p>
        </div>
      </div>
    </div>
  );
};

interface ModuleFederationCalendarProps {
  showHeader?: boolean;
}

const ModuleFederationCalendar: React.FC<ModuleFederationCalendarProps> = ({
  showHeader = false,
}) => {
  const {
    component: RemoteCalendarApp,
    loading,
    error,
  } = useRemoteComponent(ENABLE_MFE ? CALENDAR_REMOTE_URL : null, CALENDAR_SCOPE, CALENDAR_MODULE);

  if (!ENABLE_MFE || error) {
    return <LocalCalendarFallback />;
  }

  if (loading || !RemoteCalendarApp) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const sharedData = useSharedModuleState((state) => state.sharedData);
  const CalendarApp = RemoteCalendarApp as React.ComponentType<any>;

  return (
    <div className="h-full w-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar</h2>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <CalendarApp theme="light" mode="light" sharedData={sharedData} />
      </div>
    </div>
  );
};

export default ModuleFederationCalendar;
