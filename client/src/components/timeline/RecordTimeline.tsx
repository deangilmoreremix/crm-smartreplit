import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';
import { describeEvent, humanizeDiff, type TimelineEvent } from './humanizeDiff';

export const TimelineEventRow: React.FC<{ event: TimelineEvent; showRecord?: boolean }> = ({ event, showRecord }) => {
  const lines = humanizeDiff(event);
  return (
    <li className="relative pl-6 pb-4 border-l border-gray-200 dark:border-gray-700 ml-2">
      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-indigo-500" />
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
        {describeEvent(event)}
        {showRecord && (
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            {event.object_type} #{event.record_id}
          </span>
        )}
      </div>
      {lines.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
      <time className="text-xs text-gray-400 dark:text-gray-500" dateTime={event.created_at}>
        {new Date(event.created_at).toLocaleString()}
      </time>
    </li>
  );
};

export const RecordTimeline: React.FC<{
  objectType: string;
  recordId: string;
  limit?: number;
  /** Rendered instead of the timeline when timeline_events cannot be read (e.g. migration not applied). */
  fallback?: React.ReactNode;
}> = ({ objectType, recordId, limit, fallback }) => {
  const { events, loading, error } = useTimeline({ objectType, recordId }, limit);
  if (error && fallback) return <>{fallback}</>;
  if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading timeline...</div>;
  if (events.length === 0) return <div className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</div>;
  return (
    <ul aria-label="Timeline">
      {events.map((e) => (
        <TimelineEventRow key={e.id} event={e} />
      ))}
    </ul>
  );
};

export default RecordTimeline;
