import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShortcuts } from '../contexts/ShortcutContext';
import ShortcutHelpDialog from './ShortcutHelpDialog';

// Host-level shortcuts. Navigation targets were verified against the route
// table in App.tsx (/dashboard, /contacts, /pipeline, /analytics, /calendar, /tasks).
const HOST_SHORTCUTS: Array<{
  id: string;
  combo: string;
  description: string;
  category: string;
  route?: string;
  action?: 'help';
}> = [
  { id: 'host-help', combo: '?', description: 'Show keyboard shortcuts', category: 'General', action: 'help' },
  { id: 'host-dashboard', combo: 'g+d', description: 'Go to Dashboard', category: 'Navigation', route: '/dashboard' },
  { id: 'host-contacts', combo: 'g+c', description: 'Go to Contacts', category: 'Navigation', route: '/contacts' },
  { id: 'host-pipeline', combo: 'g+p', description: 'Go to Pipeline', category: 'Navigation', route: '/pipeline' },
  { id: 'host-analytics', combo: 'g+a', description: 'Go to Analytics', category: 'Navigation', route: '/analytics' },
  { id: 'host-tasks', combo: 'g+t', description: 'Go to Tasks', category: 'Navigation', route: '/tasks' },
  { id: 'host-calendar', combo: 'g+k', description: 'Go to Calendar', category: 'Navigation', route: '/calendar' },
];

export const GlobalShortcuts: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { register, unregister } = useShortcuts();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const registered: Array<{ id: string; combo: string; description: string; category: string; handler: () => void }> =
      HOST_SHORTCUTS.map((s) =>
        s.action === 'help'
          ? {
              id: s.id,
              combo: s.combo,
              description: s.description,
              category: s.category,
              handler: () => setHelpOpen(true),
            }
          : {
              id: s.id,
              combo: s.combo,
              description: s.description,
              category: s.category,
              handler: () => navigate(s.route as string),
            }
      );

    registered.forEach(register);
    return () => registered.forEach((s) => unregister(s.id));
  }, [register, unregister, navigate]);

  return (
    <>
      {children}
      <ShortcutHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default GlobalShortcuts;
