import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';
import { TimelineEventRow } from './RecordTimeline';

/** Global recent activity, for the dashboard. */
export const ActivityFeed: React.FC<{ limit?: number; title?: string }> = ({ limit = 20, title = 'Recent activity' }) => {
  const { events, loading } = useTimeline(undefined, limit);
  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</div>
      ) : (
        <ul>
          {events.map((e) => (
            <TimelineEventRow key={e.id} event={e} showRecord />
          ))}
        </ul>
      )}
    </section>
  );
};

export default ActivityFeed;
