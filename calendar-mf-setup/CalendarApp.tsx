// Module Federation Entry Point for calendar.smartcrm.vip
// Create this file at: src/CalendarApp.tsx

import React from 'react';

// Import your main calendar/dashboard component
// Replace 'YourMainApp' with your actual main component
import YourMainApp from './App'; // or wherever your main component is

interface CalendarAppProps {
  theme?: 'light' | 'dark';
  mode?: 'light' | 'dark';
  sharedData?: {
    appointments?: any[];
    contacts?: any[];
    user?: any;
  };
  onDataUpdate?: (data: any) => void;
}

const CalendarApp: React.FC<CalendarAppProps> = ({ 
  theme = 'light', 
  mode = 'light',
  sharedData = {},
  onDataUpdate 
}) => {
  console.log('📅 CalendarApp loaded via Module Federation');
  console.log('🎨 Theme:', theme, 'Mode:', mode);
  console.log('📊 Shared data:', sharedData);

  // Handle data updates from your app
  const handleDataChange = (data: any) => {
    console.log('📤 Calendar data update:', data);
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  };

  return (
    <div className="w-full h-full" data-module-federation="calendar">
      {/* Replace YourMainApp with your actual component */}
      <YourMainApp 
        theme={theme}
        mode={mode}
        appointments={sharedData?.appointments}
        contacts={sharedData?.contacts}
        user={sharedData?.user}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default CalendarApp;
