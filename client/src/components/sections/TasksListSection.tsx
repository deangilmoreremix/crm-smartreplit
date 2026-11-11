import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { completeTask } from '../dashboard/UnifiedActivityData';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const MAX_ROWS = 8;

export interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  dueAt: number | null;
  priority?: string;
}

const toMs = (v: unknown): number | null => {
  if (!v) return null;
  const t = v instanceof Date ? v.getTime() : Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
};

const isDoneStatus = (s: unknown) => s === 'completed' || s === 'cancelled';

/** Map a /api/tasks (or task store) row; rows without an id are dropped. */
export function toTaskRow(t: any): TaskRow | null {
  if (t?.id == null) return null;
  return {
    id: String(t.id),
    title: String(t.title ?? 'Untitled task'),
    done: isDoneStatus(t.status),
    dueAt: toMs(t.dueDate ?? t.due_date),
    priority: t.priority ? String(t.priority) : undefined,
  };
}

/** Open tasks first (soonest due first, undated last), then completed ones; at most `limit`. */
export function selectDashboardTasks(rows: TaskRow[], limit = MAX_ROWS): TaskRow[] {
  const open = rows
    .filter((r) => !r.done)
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
  return [...open, ...rows.filter((r) => r.done)].slice(0, limit);
}

type Source = 'api' | 'local';

/** Dashboard "Tasks & Activities" widget: tasks from the API, falling back to the local task store. */
const TasksListSection: React.FC = () => {
  const navigate = useNavigate();
  const localTasks = useTaskStore((s) => s.tasks);
  const updateLocalTask = useTaskStore((s) => s.updateTask);
  const [apiRows, setApiRows] = React.useState<TaskRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const mounted = React.useRef(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : (data?.data ?? []);
      if (!mounted.current) return;
      setApiRows(list.flatMap((t) => toTaskRow(t) ?? []));
      setFailed(false);
    } catch {
      if (!mounted.current) return;
      setApiRows(null);
      setFailed(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const source: Source = apiRows ? 'api' : 'local';
  const rows = React.useMemo(
    () => selectDashboardTasks(apiRows ?? localTasks.flatMap((t) => toTaskRow(t) ?? [])),
    [apiRows, localTasks]
  );

  const complete = async (row: TaskRow) => {
    if (row.done) return;
    if (source === 'local') {
      updateLocalTask(row.id, { status: 'completed' });
      return;
    }
    const mark = (done: boolean) =>
      setApiRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, done } : r)) ?? prev);
    mark(true);
    const ok = await completeTask({ rawId: row.id, title: row.title }).catch(() => false);
    if (!ok && mounted.current) mark(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm" data-testid="tasks-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks & Activities</h3>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View all
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <LoadingSpinner message="Loading tasks..." size="md" />
      ) : failed && rows.length === 0 ? (
        <div role="alert" className="text-sm text-red-600 dark:text-red-400">
          <p>Could not load tasks.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tasks yet. You are all caught up.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => void complete(r)}
                disabled={r.done}
                title={r.done ? 'Completed' : 'Mark complete'}
                aria-label={r.done ? `${r.title} completed` : `Mark ${r.title} complete`}
                className="text-gray-400 hover:text-green-600 disabled:text-green-600"
              >
                {r.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    r.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {r.title}
                </p>
                {(r.dueAt !== null || r.priority) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {r.dueAt !== null ? `Due ${new Date(r.dueAt).toLocaleDateString()}` : ''}
                    {r.dueAt !== null && r.priority ? ' · ' : ''}
                    {r.priority ? `Priority: ${r.priority}` : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksListSection;
