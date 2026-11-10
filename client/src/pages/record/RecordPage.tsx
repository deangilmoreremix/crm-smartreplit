import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContactActivityTimeline } from '../../components/ContactActivityTimeline';
import { RecordTimeline } from '../../components/timeline';
import { RichNoteEditor, RichNoteView, toStored, EMPTY_NOTE, type DocNode, type NoteValue } from '../../components/notes';
import FavoriteButton from '../../components/FavoriteButton';
import ContactAttachments from '../../components/ContactAttachments';
import InlineEditCell from '../../components/InlineEditCell';
import { usePersistedLayout } from '../../hooks/usePersistedLayout';
import { LayoutCustomizer, LayoutPref, applyLayout, emptyLayout } from './layout';

export type RecordObjectType = 'contact' | 'company' | 'deal';

export interface TargetNote {
  id: string;
  title?: string | null;
  content: string;
  /** Rich (tiptap) body; null/absent for legacy plain notes. */
  body_json?: DocNode | null;
  body_text?: string | null;
  createdAt?: string | null;
}
export interface TargetTask {
  id: number;
  title: string;
  status?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
}

export async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Notes and tasks attached to a record through note_targets / task_targets. */
export function useRecordTargets(objectType: RecordObjectType, recordId: string) {
  const [notes, setNotes] = useState<TargetNote[]>([]);
  const [tasks, setTasks] = useState<TargetTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/crm/targets/${objectType}/${encodeURIComponent(recordId)}`;

  const reload = useCallback(async () => {
    try {
      const [n, t] = await Promise.all([json<TargetNote[]>(`${base}/notes`), json<TargetTask[]>(`${base}/tasks`)]);
      setNotes(n);
      setTasks(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [base]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addNote = useCallback(
    async (content: string, rich?: RichNotePayload) => {
      const body: Record<string, unknown> = { content, ...rich };
      if (objectType === 'contact') body.contactId = Number(recordId);
      const note = await json<{ id: string }>('/api/notes', { method: 'POST', body: JSON.stringify(body) });
      await json(`${base}/notes`, { method: 'POST', body: JSON.stringify({ noteId: note.id }) });
      await reload();
    },
    [base, objectType, recordId, reload]
  );

  const addTask = useCallback(
    async (title: string, dueDate?: string) => {
      const body: Record<string, unknown> = { title };
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      if (objectType === 'contact') body.contactId = Number(recordId);
      if (objectType === 'deal') body.dealId = Number(recordId);
      const task = await json<{ id: number }>('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
      await json(`${base}/tasks`, { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
      await reload();
    },
    [base, objectType, recordId, reload]
  );

  const setTaskDone = useCallback(
    async (task: TargetTask, done: boolean) => {
      await json(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ status: done ? 'completed' : 'pending' }) });
      await reload();
    },
    [reload]
  );

  return { notes, tasks, error, reload, addNote, addTask, setTaskDone };
}

export interface RichNotePayload {
  body_json: DocNode | null;
  body_text: string;
}

export interface NoteEditorSlotProps {
  /** `content` is the plain text; `rich` carries the tiptap JSON for the notes API. */
  onSubmit: (content: string, rich?: RichNotePayload) => Promise<void>;
}

/** Tiptap-based default editor for the Notes tab; stores JSON plus plain-text `content`. */
export const RichNoteSlot: React.FC<NoteEditorSlotProps> = ({ onSubmit }) => {
  const [value, setValue] = useState<NoteValue>(EMPTY_NOTE);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (v: NoteValue) => {
    if (!v.text.trim()) return;
    setErr(null);
    try {
      const { content, body_json, body_text } = toStored(v);
      await onSubmit(content, { body_json, body_text });
      setValue(EMPTY_NOTE);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save note');
    }
  };
  return (
    <div className="space-y-2">
      <RichNoteEditor value={value} onChange={setValue} onSubmit={(v) => void submit(v)} />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
};

type Targets = ReturnType<typeof useRecordTargets>;

const NotesTab: React.FC<{ t: Targets; renderNoteEditor?: (p: NoteEditorSlotProps) => React.ReactNode }> = ({ t, renderNoteEditor }) => (
  <div className="space-y-4">
    {renderNoteEditor ? renderNoteEditor({ onSubmit: t.addNote }) : <RichNoteSlot onSubmit={t.addNote} />}
    {t.error && <p role="alert" className="text-sm text-red-600">{t.error}</p>}
    {t.notes.length === 0 && !t.error && <p className="text-sm text-gray-500">No notes yet.</p>}
    <ul className="space-y-3">
      {t.notes.map((n) => (
        <li key={n.id} className="border rounded p-3 text-sm">
          {n.title && <div className="font-medium">{n.title}</div>}
          <RichNoteView json={n.body_json ?? null} text={n.body_text ?? n.content} />
          {n.createdAt && <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>}
        </li>
      ))}
    </ul>
  </div>
);

const TasksTab: React.FC<{ t: Targets }> = ({ t }) => {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const add = async () => {
    if (!title.trim()) return;
    setErr(null);
    try {
      await t.addTask(title.trim(), due || undefined);
      setTitle('');
      setDue('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add task');
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" className="border rounded px-2 py-1 text-sm flex-1 min-w-[12rem]" />
        <input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button type="button" onClick={add} disabled={!title.trim()} className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50">
          Add task
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {t.tasks.length === 0 && <p className="text-sm text-gray-500">No tasks yet.</p>}
      <ul className="space-y-2">
        {t.tasks.map((k) => (
          <li key={k.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" aria-label={`Complete ${k.title}`} checked={k.status === 'completed'} onChange={(e) => void t.setTaskDone(k, e.target.checked)} />
            <span className={k.status === 'completed' ? 'line-through text-gray-400' : ''}>{k.title}</span>
            {k.dueDate && <span className="text-xs text-gray-500 ml-auto">{new Date(k.dueDate).toLocaleDateString()}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

const CombinedTimeline: React.FC<{ t: Targets }> = ({ t }) => {
  const entries = [
    ...t.notes.map((n) => ({ key: `n${n.id}`, kind: 'Note', text: n.content, at: n.createdAt })),
    ...t.tasks.map((k) => ({ key: `t${k.id}`, kind: 'Task', text: k.title, at: k.createdAt })),
  ].sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')));
  if (entries.length === 0) return <p className="text-sm text-gray-500">No activity yet.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {entries.map((e) => (
        <li key={e.key} className="border-l-2 pl-3">
          <span className="text-xs uppercase text-gray-500">{e.kind}</span> {e.text}
          {e.at && <div className="text-xs text-gray-400">{new Date(e.at).toLocaleString()}</div>}
        </li>
      ))}
    </ul>
  );
};

export const RECORD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'related', label: 'Related' },
] as const;
type TabId = (typeof RECORD_TABS)[number]['id'];

export interface RecordShellProps {
  objectType: RecordObjectType;
  recordId: string;
  overview: React.ReactNode;
  related: React.ReactNode;
  /** Slot for a rich note editor; receives `onSubmit(content)`. Defaults to the tiptap RichNoteSlot. */
  renderNoteEditor?: (p: NoteEditorSlotProps) => React.ReactNode;
}

/** Tab shell shared by the contact, company and deal record pages. `?tab=` selects a tab. */
export const RecordShell: React.FC<RecordShellProps> = ({ objectType, recordId, overview, related, renderNoteEditor }) => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as TabId | null;
  const tab: TabId = RECORD_TABS.some((x) => x.id === requested) ? (requested as TabId) : 'overview';
  const targets = useRecordTargets(objectType, recordId);
  const filesKey = objectType === 'contact' ? recordId : `${objectType}-${recordId}`;

  return (
    <div>
      <div role="tablist" aria-label="Record sections" className="flex gap-6 border-b mb-4">
        {RECORD_TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', x.id); return n; }, { replace: true })}
            className={`py-2 text-sm font-medium border-b-2 ${tab === x.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {x.label}
            {x.id === 'notes' && targets.notes.length > 0 ? ` (${targets.notes.length})` : ''}
            {x.id === 'tasks' && targets.tasks.length > 0 ? ` (${targets.tasks.length})` : ''}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'overview' && overview}
        {tab === 'timeline' && (
          <RecordTimeline
            objectType={objectType}
            recordId={recordId}
            fallback={objectType === 'contact' ? <ContactActivityTimeline contactId={recordId} /> : <CombinedTimeline t={targets} />}
          />
        )}
        {tab === 'notes' && <NotesTab t={targets} renderNoteEditor={renderNoteEditor} />}
        {tab === 'tasks' && <TasksTab t={targets} />}
        {tab === 'files' && <ContactAttachments contactId={filesKey} />}
        {tab === 'related' && related}
      </div>
    </div>
  );
};

/** A list of related records for the Related tab. */
export const RelatedList: React.FC<{ title: string; items: { id: string; label: string; href?: string; meta?: string }[]; empty?: string }> = ({
  title,
  items,
  empty = 'None',
}) => (
  <section className="mb-6">
    <h3 className="font-medium mb-2">{title}</h3>
    {items.length === 0 ? (
      <p className="text-sm text-gray-500">{empty}</p>
    ) : (
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id}>
            {i.href ? <Link to={i.href} className="text-blue-600 hover:underline">{i.label}</Link> : i.label}
            {i.meta && <span className="text-gray-500"> · {i.meta}</span>}
          </li>
        ))}
      </ul>
    )}
  </section>
);

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  format?: (value: unknown) => string;
}

export interface RecordPageProps {
  objectType: RecordObjectType;
  recordId: string;
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  record: Record<string, unknown> | null;
  loading: boolean;
  error?: string | null;
  fields: FieldDef[];
  onSaveField: (key: string, value: string | number) => Promise<void>;
  related: React.ReactNode;
  renderNoteEditor?: RecordShellProps['renderNoteEditor'];
  headerActions?: React.ReactNode;
}

/** Generic record page: header, configurable field list (inline edit) and the shared tabs. */
const RecordPage: React.FC<RecordPageProps> = ({
  objectType,
  recordId,
  title,
  subtitle,
  backHref,
  backLabel,
  record,
  loading,
  error,
  fields,
  onSaveField,
  related,
  renderNoteEditor,
  headerActions,
}) => {
  const { value: layout, setValue: setLayout } = usePersistedLayout<LayoutPref>('record-layout', `${objectType}:fields`, emptyLayout);
  const [customizing, setCustomizing] = useState(false);
  const visible = useMemo(() => applyLayout(fields.map((f) => ({ ...f, id: f.key })), layout), [fields, layout]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading...</div>;
  if (error || !record) {
    return (
      <div className="p-8" role="alert">
        <p className="text-red-700">{error ?? 'Record not found'}</p>
        <Link to={backHref} className="text-blue-600 text-sm">Back to {backLabel}</Link>
      </div>
    );
  }

  const overview = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setCustomizing((c) => !c)} className="text-sm text-blue-600">
          {customizing ? 'Done' : 'Customize layout'}
        </button>
      </div>
      {customizing && (
        <LayoutCustomizer title="Fields" items={fields.map((f) => ({ id: f.key, label: f.label }))} layout={layout} onChange={setLayout} />
      )}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {visible.map((f) => (
          <div key={f.key}>
            <dt className="text-xs text-gray-500 mb-0.5">{f.label}</dt>
            <dd className="text-sm">
              {f.readOnly ? (
                f.format ? f.format(record[f.key]) : String(record[f.key] ?? '-')
              ) : (
                <InlineEditCell
                  value={record[f.key] as string | number | null | undefined}
                  type={f.type ?? 'text'}
                  options={f.options}
                  onSave={(v) => onSaveField(f.key, v)}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <Link to={backHref} className="text-sm text-gray-500 hover:text-gray-700">← {backLabel}</Link>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton objectType={objectType} recordId={recordId} />
          {headerActions}
        </div>
      </header>
      <RecordShell objectType={objectType} recordId={recordId} overview={overview} related={related} renderNoteEditor={renderNoteEditor} />
    </div>
  );
};

export default RecordPage;
