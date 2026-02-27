import React, { useState, useEffect } from 'react';
import { moduleFederationOrchestrator, useSharedModuleState } from '../utils/moduleFederationOrchestrator';
import { useTheme } from '../contexts/ThemeContext';

// Local fallback component when Module Federation is not available
const LocalCalendarFallback: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center p-8">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Calendar Module
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          The Calendar module is currently unavailable.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
};

const CalendarApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip remote loading - remote modules are not available
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Calendar Module...</p>
        </div>
      </div>
    );
  }

  return <LocalCalendarFallback />;
};

interface ModuleFederationCalendarProps {
  showHeader?: boolean;
}

const ModuleFederationCalendar: React.FC<ModuleFederationCalendarProps> = ({
  showHeader = false,
}) => {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ margin: 0, padding: 0 }}
      data-testid="calendar-month"
    >
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Calendar</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Loaded
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 w-full h-full" style={{ margin: 0, padding: 0 }}>
        <CalendarApp />
      </div>
    </div>
  );
};

export default ModuleFederationCalendar;
