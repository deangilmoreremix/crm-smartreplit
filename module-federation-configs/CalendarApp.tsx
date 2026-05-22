// CalendarApp.tsx - Module Federation Entry Point

import React, { useEffect } from 'react';

interface CalendarAppProps {
  theme?: 'light' | 'dark';
  mode?: 'light' | 'dark';
  sharedData?: {
    appointments?: any[];
    contacts?: any[];
    user?: any;
    isAuthenticated?: boolean;
  };
  onDataUpdate?: (data: any) => void;
}

const CalendarApp: React.FC<CalendarAppProps> = ({
  theme = 'light',
  mode = 'light',
  sharedData = {},
  onDataUpdate,
}) => {
  console.log('📅 CalendarApp loaded via Module Federation');
  console.log('🎨 Theme:', theme, 'Mode:', mode);
  console.log('📊 Shared data:', sharedData);

  // Handle data updates from your app
  const handleCalendarAction = (action: string, data?: any) => {
    console.log('📤 Calendar action:', action);
    if (onDataUpdate) {
      onDataUpdate({ type: `CALENDAR_${action}`, data });
    }
    // Post message to parent
    window.parent.postMessage(
      { type: `CALENDAR_${action}`, data, source: 'REMOTE_CALENDAR' },
      '*'
    );
  };

  useEffect(() => {
    // Notify parent that calendar module is ready
    window.parent.postMessage(
      {
        type: 'CALENDAR_MODULE_READY',
        source: 'REMOTE_CALENDAR',
      },
      '*'
    );
  }, []);

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">AI Calendar</h2>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="aspect-square border rounded p-1 text-xs hover:bg-gray-50 cursor-pointer"
              onClick={() => handleCalendarAction('DAY_CLICK', { day: i + 1 })}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarApp;
