import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { computeEngagement, type EngagementInput } from './engagement';

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

async function countActivities(contactId: string): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from('contact_activities')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', contactId);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

/** Engagement summary built from this contact's real activities, notes, tasks and deals. */
const ContactEngagement: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [input, setInput] = useState<EngagementInput | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [activities, notes, tasks, deals] = await Promise.all([
        countActivities(contactId),
        getJson<unknown[]>(`/api/notes/contact/${encodeURIComponent(contactId)}`),
        getJson<Array<{ contactId?: number | string | null; status?: string | null }>>('/api/tasks'),
        getJson<Array<{ contactId?: number | string | null; stage?: string | null; status?: string | null }>>('/api/deals'),
      ]);
      if (cancelled) return;
      setInput({
        activities,
        notes: notes ? notes.length : null,
        tasks: tasks ? tasks.filter((t) => String(t.contactId) === String(contactId)) : null,
        deals: deals ? deals.filter((d) => String(d.contactId) === String(contactId)) : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  if (!input) return <div className="text-sm text-gray-500">Loading engagement...</div>;
  const s = computeEngagement(input);
  const rows: Array<[string, number | null]> = [
    ['Activities', s.activities],
    ['Notes', s.notes],
    ['Tasks', s.tasksTotal],
    ['Deals', s.deals],
  ];
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {rows.map(([label, n]) => (
          <div key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium" data-testid={`engagement-${label.toLowerCase()}`}>{n ?? '-'}</dd>
          </div>
        ))}
      </dl>
      {s.taskCompletionPct !== null && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Tasks completed</span>
            <span className="font-medium">
              {s.tasksCompleted}/{s.tasksTotal} ({s.taskCompletionPct}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${s.taskCompletionPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactEngagement;
