import { isMissingTableError } from '../../hooks/useDashboardLayoutStore';

export type UnifiedKind = 'task' | 'appointment' | 'activity';
export type UnifiedFilter = 'all' | 'tasks' | 'appointments' | 'activity';

export interface UnifiedItem {
  id: string; // `${kind}:${rawId}`
  kind: UnifiedKind;
  rawId: string;
  title: string;
  subtitle?: string;
  /** epoch ms used for ordering (due date / start time / created_at) */
  at: number;
  done?: boolean;
  href?: string;
}

const toMs = (v: unknown): number | null => {
  if (!v) return null;
  const t = typeof v === 'number' ? v : Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
};

export function taskToItem(t: any): UnifiedItem | null {
  const at = toMs(t?.dueDate ?? t?.due_date) ?? toMs(t?.createdAt ?? t?.created_at);
  if (t?.id == null || at == null) return null;
  const status = String(t.status ?? 'pending');
  return {
    id: `task:${t.id}`,
    kind: 'task',
    rawId: String(t.id),
    title: String(t.title ?? 'Untitled task'),
    subtitle: t.priority ? `Priority: ${t.priority}` : undefined,
    at,
    done: status === 'completed' || status === 'cancelled',
    href: '/tasks',
  };
}

export function appointmentToItem(a: any): UnifiedItem | null {
  const at = toMs(a?.startTime ?? a?.start_time);
  if (a?.id == null || at == null) return null;
  return {
    id: `appointment:${a.id}`,
    kind: 'appointment',
    rawId: String(a.id),
    title: String(a.title ?? 'Appointment'),
    subtitle: a.location || undefined,
    at,
    done: a.status === 'completed' || a.status === 'cancelled',
    href: '/appointments',
  };
}

export function timelineToItem(e: any): UnifiedItem | null {
  const at = toMs(e?.created_at);
  if (e?.id == null || at == null) return null;
  return {
    id: `activity:${e.id}`,
    kind: 'activity',
    rawId: String(e.id),
    title: String(e.summary || `${e.event_type ?? 'event'} on ${e.object_type ?? 'record'}`),
    subtitle: e.object_type ? String(e.object_type) : undefined,
    at,
    href: e.object_type === 'contact' && e.record_id ? `/contacts/${e.record_id}` : undefined,
  };
}

const FILTER_KIND: Record<UnifiedFilter, UnifiedKind | null> = {
  all: null,
  tasks: 'task',
  appointments: 'appointment',
  activity: 'activity',
};

/**
 * Merge + sort: upcoming items (at >= now) first in ascending order (soonest first), then past
 * items newest first. Duplicate ids are dropped.
 */
export function mergeUnifiedItems(
  items: UnifiedItem[],
  opts: { filter?: UnifiedFilter; now?: number; limit?: number } = {}
): UnifiedItem[] {
  const { filter = 'all', now = Date.now(), limit } = opts;
  const kind = FILTER_KIND[filter];
  const seen = new Set<string>();
  const kept = items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return !kind || i.kind === kind;
  });
  const upcoming = kept.filter((i) => i.at >= now && !i.done).sort((a, b) => a.at - b.at);
  const past = kept.filter((i) => !(i.at >= now && !i.done)).sort((a, b) => b.at - a.at);
  const out = [...upcoming, ...past];
  return limit ? out.slice(0, limit) : out;
}

export interface UnifiedFetchResult {
  items: UnifiedItem[];
  /** sources that were skipped (missing table, HTTP error) */
  skipped: UnifiedKind[];
}

async function fetchJson(fetcher: typeof fetch, url: string): Promise<any[]> {
  const res = await fetcher(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
}

/** Fetch all three sources defensively: any failing source is skipped, never throws. */
export async function fetchUnifiedItems(
  deps: { fetcher?: typeof fetch; supabase?: any } = {}
): Promise<UnifiedFetchResult> {
  const fetcher = deps.fetcher ?? fetch;
  const skipped: UnifiedKind[] = [];

  const timeline = async (): Promise<any[]> => {
    if (!deps.supabase) throw new Error('no client');
    const { data, error } = await deps.supabase
      .from('timeline_events')
      .select('id, object_type, record_id, event_type, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      if (isMissingTableError(error)) throw new Error('missing table');
      throw error;
    }
    return data ?? [];
  };

  const [tasks, appts, events] = await Promise.allSettled([
    fetchJson(fetcher, '/api/tasks'),
    fetchJson(fetcher, '/api/appointments'),
    timeline(),
  ]);

  const items: UnifiedItem[] = [];
  const collect = (
    r: PromiseSettledResult<any[]>,
    kind: UnifiedKind,
    map: (x: any) => UnifiedItem | null
  ) => {
    if (r.status === 'fulfilled') {
      for (const x of r.value) {
        const m = map(x);
        if (m) items.push(m);
      }
    } else {
      skipped.push(kind);
    }
  };
  collect(tasks, 'task', taskToItem);
  collect(appts, 'appointment', appointmentToItem);
  collect(events, 'activity', timelineToItem);
  return { items, skipped };
}

/** Quick complete via the existing task update endpoint (PUT validates the full insert schema). */
export async function completeTask(
  task: { rawId: string; title: string },
  fetcher: typeof fetch = fetch
): Promise<boolean> {
  const res = await fetcher(`/api/tasks/${task.rawId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: task.title, status: 'completed' }),
  });
  return res.ok;
}
