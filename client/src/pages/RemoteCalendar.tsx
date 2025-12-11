import React from 'react';
import ModuleFederationCalendar from '../components/ModuleFederationCalendar';

const RemoteCalendar: React.FC = () => {
  return (
    <div className="h-full w-full">
      <ModuleFederationCalendar showHeader={false} />
    </div>
  );
};

export default RemoteCalendar;