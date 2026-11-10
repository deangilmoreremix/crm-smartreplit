import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TimelineEvent } from '../components/timeline/humanizeDiff';

/** Events for one record (or the most recent events overall when no target is given), live via Realtime. */
export function useTimeline(target?: { objectType: string; recordId: string }, limit = 50) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const objectType = target?.objectType;
  const recordId = target?.recordId;

  useEffect(() => {
    let cancelled = false;
    const matches = (e: TimelineEvent) => !objectType || (e.object_type === objectType && e.record_id === String(recordId));

    (async () => {
      let q = supabase.from('timeline_events').select('*').order('created_at', { ascending: false }).limit(limit);
      if (objectType) q = q.eq('object_type', objectType).eq('record_id', String(recordId));
      const { data, error: qErr } = await q;
      if (!cancelled) {
        setError(qErr ?? null);
        setEvents((data as TimelineEvent[]) ?? []);
        setLoading(false);
      }
    })().catch((e) => {
      if (!cancelled) {
        setError(e);
        setLoading(false);
      }
    });

    const channel = supabase
      .channel(`timeline:${objectType ?? 'all'}:${recordId ?? ''}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timeline_events' },
        (payload: { new: TimelineEvent }) => {
          const e = payload.new;
          if (!matches(e)) return;
          setEvents((prev) => (prev.some((p) => p.id === e.id) ? prev : [e, ...prev].slice(0, limit)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [objectType, recordId, limit]);

  return { events, loading, error };
}
