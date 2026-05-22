// CalendarModule.tsx - Calendar Module Federation Entry
import React from 'react';

interface CalendarModuleProps {
  sharedData?: {
    appointments?: any[];
    contacts?: any[];
    user?: any;
  };
}

const CalendarModule: React.FC<CalendarModuleProps> = ({ sharedData }) => {
  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Calendar Module</h3>
      <p className="text-sm text-gray-600">
        Appointments: {sharedData?.appointments?.length || 0}
      </p>
    </div>
  );
};

export default CalendarModule;
