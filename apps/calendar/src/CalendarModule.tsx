// CalendarModule.tsx - Lightweight module federation entry
import React from 'react';

interface CalendarModuleProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const CalendarModule: React.FC<CalendarModuleProps> = ({ sharedData }) => {
  const isAuthenticated = sharedData?.isAuthenticated ?? false;

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-gray-600">Please log in via the main CRM.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Calendar Module</h3>
      <p className="text-sm text-gray-600">AI-powered scheduling</p>
    </div>
  );
};

export default CalendarModule;
