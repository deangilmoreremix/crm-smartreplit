import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface ResearchItem { id: string; title: string; summary: string; }

interface ResearchAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const ResearchApp: React.FC<ResearchAppProps> = ({ sharedData }) => {
  const [items] = useState<ResearchItem[]>([
    { id: '1', title: 'Market Analysis', summary: 'Total addressable market: $50B' }
  ]);
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const itemsRef = useRef(items);
  itemsRef.current = items;

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
    return eventBus.onRequest('research', async (action) => {
      if (action === 'getResearch') return itemsRef.current;
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
      <h1 className="text-2xl font-bold mb-6">Product Research</h1>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-3">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchApp;
