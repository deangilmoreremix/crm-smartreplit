import React, { useState } from 'react';
import type { BulkAdapter, BulkResult, SelectOption } from './types';

interface Props<T> {
  rows: T[];
  adapter: BulkAdapter<T>;
  getLabel: (row: T) => string;
  onClear: () => void;
  /** Called after any action that changed data. */
  onChanged: () => void;
}

type Panel = 'edit' | 'tag' | 'owner' | 'merge' | 'delete' | null;

function BulkActionBar<T>({ rows, adapter, getLabel, onClear, onChanged }: Props<T>) {
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; errors: string[]; ok: boolean } | null>(null);
  const [field, setField] = useState(adapter.editFields?.[0]?.id ?? '');
  const [value, setValue] = useState('');
  const [tag, setTag] = useState('');
  const [owner, setOwner] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<SelectOption[]>([]);
  const [keepIdx, setKeepIdx] = useState(0);

  const run = async (label: string, fn: () => Promise<BulkResult | void>) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn();
      const errors = res ? res.errors.map((e) => `${e.id}: ${e.message}`) : [];
      const done = res ? res.succeeded : rows.length;
      setMessage({
        ok: errors.length === 0,
        text: `${label}: ${done} succeeded${errors.length ? `, ${errors.length} failed` : ''}.`,
        errors,
      });
      if (done > 0) onChanged();
      setPanel(null);
    } catch (e) {
      setMessage({ ok: false, text: `${label} failed: ${e instanceof Error ? e.message : String(e)}`, errors: [] });
    } finally {
      setBusy(false);
    }
  };

  const open = (p: Panel) => {
    setPanel((cur) => (cur === p ? null : p));
    if (p === 'owner' && adapter.loadOwnerOptions && ownerOptions.length === 0) {
      void adapter.loadOwnerOptions().then((o) => {
        setOwnerOptions(o);
        setOwner(o[0]?.value ?? '');
      });
    }
  };

  const editField = adapter.editFields?.find((f) => f.id === field);
  const btn = 'px-2 py-1 text-sm border rounded bg-white hover:bg-gray-50 disabled:opacity-50';

  return (
    <div role="toolbar" aria-label="Bulk actions" className="mb-2 rounded-md border bg-blue-50 p-2 text-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{rows.length} selected</span>
        {adapter.editFields && adapter.editFields.length > 0 && (
          <button className={btn} onClick={() => open('edit')} disabled={busy}>
            Edit field
          </button>
        )}
        {adapter.addTag && (
          <button className={btn} onClick={() => open('tag')} disabled={busy}>
            Add tag
          </button>
        )}
        {adapter.assignOwner && (
          <button className={btn} onClick={() => open('owner')} disabled={busy}>
            Assign owner
          </button>
        )}
        {adapter.merge && (
          <button className={btn} onClick={() => open('merge')} disabled={busy || rows.length !== 2} title="Select exactly 2 records">
            Merge
          </button>
        )}
        <button className={`${btn} text-red-600`} onClick={() => open('delete')} disabled={busy}>
          Delete
        </button>
        <button className="ml-auto text-gray-600 underline" onClick={onClear}>
          Clear
        </button>
      </div>

      {panel === 'edit' && editField && (
        <div className="flex items-center gap-2">
          <select aria-label="Field to edit" value={field} onChange={(e) => { setField(e.target.value); setValue(''); }} className="border rounded px-1 py-1">
            {adapter.editFields!.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          {editField.type === 'select' ? (
            <select aria-label="New value" value={value} onChange={(e) => setValue(e.target.value)} className="border rounded px-1 py-1">
              <option value="">Select...</option>
              {editField.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input aria-label="New value" type={editField.type === 'number' ? 'number' : 'text'} value={value} onChange={(e) => setValue(e.target.value)} className="border rounded px-2 py-1" />
          )}
          <button className={btn} disabled={busy || value === ''} onClick={() => run('Update', () => adapter.updateMany(rows, { [field]: editField.type === 'number' ? Number(value) : value }))}>
            Apply to {rows.length}
          </button>
        </div>
      )}

      {panel === 'tag' && adapter.addTag && (
        <div className="flex items-center gap-2">
          <input aria-label="Tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag name" className="border rounded px-2 py-1" />
          <button className={btn} disabled={busy || !tag.trim()} onClick={() => run('Tag', () => adapter.addTag!(rows, tag.trim()))}>
            Add to {rows.length}
          </button>
        </div>
      )}

      {panel === 'owner' && adapter.assignOwner && (
        <div className="flex items-center gap-2">
          <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="border rounded px-1 py-1">
            {ownerOptions.length === 0 && <option value="">No owners available</option>}
            {ownerOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className={btn} disabled={busy || !owner} onClick={() => run('Assign owner', () => adapter.assignOwner!(rows, owner))}>
            Assign
          </button>
        </div>
      )}

      {panel === 'merge' && adapter.merge && rows.length === 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Keep</span>
          <select aria-label="Record to keep" value={keepIdx} onChange={(e) => setKeepIdx(Number(e.target.value))} className="border rounded px-1 py-1">
            {rows.map((r, i) => (
              <option key={i} value={i}>{getLabel(r)}</option>
            ))}
          </select>
          <span>and merge {getLabel(rows[1 - keepIdx])} into it (empty fields are filled in; the other record is deleted).</span>
          <button className={`${btn} text-red-600`} disabled={busy} onClick={() => run('Merge', () => adapter.merge!(rows[keepIdx], rows[1 - keepIdx]))}>
            Confirm merge
          </button>
        </div>
      )}

      {panel === 'delete' && (
        <div className="flex items-center gap-2">
          <span>Delete {rows.length} record{rows.length === 1 ? '' : 's'}? This cannot be undone.</span>
          <button className={`${btn} bg-red-600 text-white hover:bg-red-700`} disabled={busy} onClick={() => run('Delete', () => adapter.deleteMany(rows))}>
            Confirm delete
          </button>
          <button className={btn} onClick={() => setPanel(null)}>Cancel</button>
        </div>
      )}

      {message && (
        <div role="status" className={message.ok ? 'text-green-700' : 'text-red-700'}>
          {message.text}
          {message.errors.length > 0 && (
            <ul className="text-xs max-h-20 overflow-y-auto">
              {message.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default BulkActionBar;
