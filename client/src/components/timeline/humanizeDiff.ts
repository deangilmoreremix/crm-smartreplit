export interface TimelineEvent {
  id: string;
  user_id?: string;
  object_type: string;
  record_id: string;
  event_type: 'insert' | 'update' | 'delete' | 'note' | 'task' | 'email' | 'ai';
  actor: string | null;
  diff: Record<string, any> | null;
  summary: string | null;
  created_at: string;
}

const HIDDEN = new Set(['id', 'created_at', 'updated_at', 'profile_id', 'user_id', 'body_json']);

export function humanizeField(key: string): string {
  const s = key.replace(/_/g, ' ').replace(/\bid\b/i, 'ID').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return 'empty';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
}

/** Turn an event's diff into readable lines, e.g. `Stage: "lead" → "won"`. */
export function humanizeDiff(event: Pick<TimelineEvent, 'event_type' | 'diff' | 'object_type' | 'summary'>): string[] {
  const diff = event.diff ?? {};
  const keys = Object.keys(diff).filter((k) => !HIDDEN.has(k));
  if (event.event_type === 'update') {
    return keys.map((k) => {
      const d = diff[k] ?? {};
      const a = formatValue(d.old);
      const b = formatValue(d.new);
      if (a === 'empty') return `${humanizeField(k)} set to "${b}"`;
      if (b === 'empty') return `${humanizeField(k)} cleared (was "${a}")`;
      return `${humanizeField(k)}: "${a}" → "${b}"`;
    });
  }
  if (event.event_type === 'insert' || event.event_type === 'delete') {
    return [];
  }
  return event.summary ? [event.summary] : [];
}

export function describeEvent(event: Pick<TimelineEvent, 'event_type' | 'object_type' | 'diff' | 'summary'>): string {
  const obj = event.object_type;
  switch (event.event_type) {
    case 'insert':
      return `${obj} created`;
    case 'delete':
      return `${obj} deleted`;
    case 'note':
      return 'Note added';
    case 'task':
      return 'Task activity';
    case 'email':
      return 'Email activity';
    case 'ai':
      return 'AI activity';
    case 'update': {
      const n = Object.keys(event.diff ?? {}).filter((k) => !HIDDEN.has(k)).length;
      return n === 1 ? `${obj} updated (1 change)` : `${obj} updated (${n} changes)`;
    }
  }
}
