import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Calendar, Activity as ActivityIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  completeTask,
  fetchUnifiedItems,
  mergeUnifiedItems,
  type UnifiedFilter,
  type UnifiedItem,
  type UnifiedKind,
} from './UnifiedActivityData';

const FILTERS: { id: UnifiedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'activity', label: 'Activity' },
];

const KIND_LABEL: Record<UnifiedKind, string> = {
  task: 'tasks',
  appointment: 'appointments',
  activity: 'activity',
};

const KIND_ICON = {
  task: CheckCircle2,
  appointment: Calendar,
  activity: ActivityIcon,
} as const;

interface Props {
  /** Show more rows when embedded in a full page (ActivityFeed source="unified"). */
  limit?: number;
}

const UnifiedActivityWidget: React.FC<Props> = ({ limit = 15 }) => {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [filter, setFilter] = useState<UnifiedFilter>('all');
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<UnifiedKind[]>([]);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchUnifiedItems({ supabase });
    if (!mounted.current) return;
    setItems(res.items);
    setSkipped(res.skipped);
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const visible = useMemo(() => mergeUnifiedItems(items, { filter, limit }), [items, filter, limit]);

  const complete = async (item: UnifiedItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: true } : i)));
    const ok = await completeTask(item).catch(() => false);
    if (!ok) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: false } : i)));
  };

  return (
    <div
      data-testid="unified-activity"
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unified Activity</h3>
        <div className="flex gap-1" role="tablist" aria-label="Filter activity">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && skipped.length > 0 && (
        <div
          role="status"
          data-testid="unified-skipped"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <span>Could not load {skipped.map((k) => KIND_LABEL[k]).join(', ')}.</span>
          <button
            type="button"
            onClick={() => void load()}
            className="font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing to show yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {visible.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li key={item.id} className="flex items-center gap-3 py-2">
                {item.kind === 'task' ? (
                  <button
                    onClick={() => !item.done && complete(item)}
                    disabled={item.done}
                    title={item.done ? 'Completed' : 'Mark complete'}
                    aria-label={item.done ? 'Completed' : 'Mark complete'}
                    className="text-gray-400 hover:text-green-600 disabled:text-green-600"
                  >
                    {item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                ) : (
                  <Icon size={18} className="text-gray-400" />
                )}
                <div className="min-w-0 flex-1">
                  {item.href ? (
                    <Link
                      to={item.href}
                      className={`text-sm font-medium hover:underline ${
                        item.done
                          ? 'line-through text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 capitalize">
                    {item.kind} · {format(new Date(item.at), 'MMM d, h:mm a')}
                    {item.subtitle ? ` · ${item.subtitle}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UnifiedActivityWidget;
