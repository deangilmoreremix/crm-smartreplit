import { describe, it, expect } from 'vitest';
import {
  appointmentToItem,
  fetchUnifiedItems,
  mergeUnifiedItems,
  taskToItem,
  timelineToItem,
} from '../UnifiedActivityData';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const iso = (d: number) => new Date(NOW + d * 3600_000).toISOString();

describe('mergeUnifiedItems', () => {
  const items = [
    taskToItem({ id: 1, title: 'Past task', dueDate: iso(-48), status: 'pending' })!,
    taskToItem({ id: 2, title: 'Soon task', dueDate: iso(5), status: 'pending' })!,
    appointmentToItem({ id: 'a1', title: 'Tomorrow call', startTime: iso(24) })!,
    timelineToItem({ id: 'e1', summary: 'Contact updated', created_at: iso(-1), object_type: 'contact', record_id: '9' })!,
    taskToItem({ id: 3, title: 'Done', dueDate: iso(10), status: 'completed' })!,
  ];

  it('orders upcoming ascending, then past newest first', () => {
    const out = mergeUnifiedItems(items, { now: NOW });
    // completed items count as past even with a future date (sorted newest first)
    expect(out.map((i) => i.title)).toEqual([
      'Soon task',
      'Tomorrow call',
      'Done',
      'Contact updated',
      'Past task',
    ]);
  });

  it('filters by kind and dedupes', () => {
    expect(mergeUnifiedItems(items, { filter: 'tasks', now: NOW }).every((i) => i.kind === 'task')).toBe(true);
    expect(mergeUnifiedItems(items, { filter: 'appointments', now: NOW })).toHaveLength(1);
    expect(mergeUnifiedItems(items, { filter: 'activity', now: NOW })[0].href).toBe('/contacts/9');
    expect(mergeUnifiedItems([...items, items[0]], { now: NOW })).toHaveLength(items.length);
    expect(mergeUnifiedItems(items, { now: NOW, limit: 2 })).toHaveLength(2);
  });

  it('skips rows without a usable date or id', () => {
    expect(taskToItem({ id: 1, title: 't' })).toBeNull();
    expect(appointmentToItem({ title: 'x', startTime: iso(1) })).toBeNull();
  });
});

describe('fetchUnifiedItems defensive behavior', () => {
  const ok = (data: any) => ({ ok: true, json: async () => data }) as any;

  it('skips the timeline when the table is missing', async () => {
    const fetcher = (async (url: string) =>
      url === '/api/tasks'
        ? ok([{ id: 1, title: 't', dueDate: iso(1) }])
        : ok([{ id: 'a', title: 'ap', startTime: iso(2) }])) as any;
    const supabase = {
      from: () => {
        const c: any = {
          select: () => c,
          order: () => c,
          limit: async () => ({ data: null, error: { code: 'PGRST205', message: 'Could not find the table' } }),
        };
        return c;
      },
    };
    const res = await fetchUnifiedItems({ fetcher, supabase });
    expect(res.items.map((i) => i.kind).sort()).toEqual(['appointment', 'task']);
    expect(res.skipped).toEqual(['activity']);
  });

  it('skips failing endpoints without throwing', async () => {
    const fetcher = (async () => ({ ok: false, status: 500 })) as any;
    const res = await fetchUnifiedItems({ fetcher });
    expect(res.items).toEqual([]);
    expect(res.skipped).toEqual(['task', 'appointment', 'activity']);
  });
});
