import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface CalendarEvent { id: string; title: string; date: string; }

interface CalendarAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const CalendarApp: React.FC<CalendarAppProps> = ({ sharedData }) => {
  const [events] = useState<CalendarEvent[]>([
    { id: '1', title: 'Team Meeting', date: '2024-06-15' }
  ]);
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_CHANGED') {
        setAuthState({ user: event.data.payload?.user ?? null, isAuthenticated: event.data.payload?.isAuthenticated ?? false });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return eventBus.onRequest('calendar', async (action) => {
      if (action === 'getEvents') return eventsRef.current;
      throw new Error(`Unknown action: ${action}`);
    });
  }, []);

  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in via the main CRM.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">AI Calendar</h1>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="border rounded-lg p-3">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarApp;
