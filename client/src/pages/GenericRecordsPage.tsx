import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { FieldMeta, useFields, useRecords } from '../hooks/useDataModel';

// TODO(record-table): swap this simple table for the shared RecordTable once it exists at
// client/src/components/record-table (built by another stream). Props needed: fields, records, onUpdate, onDelete.

const fmt = (v: unknown): string =>
  v === null || v === undefined ? '' : Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);

function FieldInput({ field, value, onChange }: { field: FieldMeta; value: unknown; onChange: (v: unknown) => void }) {
  const cls = 'p-2 border rounded-md w-full';
  switch (field.field_type) {
    case 'boolean':
      return <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
    case 'number': case 'currency': case 'rating':
      return <input className={cls} type="number" value={(value as number | undefined) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />;
    case 'date':
      return <input className={cls} type="date" value={(value as string | undefined)?.slice(0, 10) ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />;
    case 'datetime':
      return <input className={cls} type="datetime-local" value={(value as string | undefined)?.slice(0, 16) ?? ''} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)} />;
    case 'select':
      return (
        <select className={cls} value={(value as string | undefined) ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="" />
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'multi_select':
      return (
        <select multiple className={cls} value={(value as string[] | undefined) ?? []} onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'relation': case 'json':
      return <span className="text-xs text-gray-400">Edit via API</span>;
    default:
      return <input className={cls} type={field.field_type === 'email' ? 'email' : 'text'} value={(value as string | undefined) ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />;
  }
}

export default function GenericRecordsPage() {
  const { objectName } = useParams<{ objectName: string }>();
  const { fields, error: fieldsError } = useFields(objectName);
  const [q, setQ] = useState('');
  const { records, loading, error, hasMore, loadMore, create, remove } = useRecords(objectName, [], q);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const editable = fields.filter((f) => f.field_type !== 'relation' && f.field_type !== 'json');

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try { await create(draft); setDraft({}); setAdding(false); } catch (err: any) { setFormError(err.message); }
  };

  return (
    <PageLayout
      title={objectName ?? 'Records'}
      actions={<Button onClick={() => setAdding((a) => !a)}><Plus className="h-4 w-4 mr-2" />New record</Button>}
    >
      <div className="space-y-4">
        {adding && (
          <form onSubmit={onAdd} className="bg-white rounded-lg shadow-sm p-4 border grid gap-3 sm:grid-cols-2">
            {editable.map((f) => (
              <label key={f.id} className="text-sm">
                <span className="block text-gray-700 mb-1">{f.label}{f.is_required && ' *'}</span>
                <FieldInput field={f} value={draft[f.name]} onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))} />
              </label>
            ))}
            <div className="sm:col-span-2"><Button type="submit">Create</Button>{formError && <span className="ml-3 text-sm text-red-600">{formError}</span>}</div>
          </form>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="p-2 border rounded-md w-full max-w-sm" />
        {(error || fieldsError) && <p className="text-sm text-red-600">{error || fieldsError}</p>}
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              {fields.map((f) => <th key={f.id} className="px-3 py-2 font-medium">{f.label}</th>)}
              <th />
            </tr></thead>
            <tbody>
              {loading ? <tr><td className="px-3 py-3 text-gray-500">Loading...</td></tr> : records.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  {fields.map((f) => <td key={f.id} className="px-3 py-2">{fmt(r.data[f.name])}</td>)}
                  <td className="px-3 py-2 text-right">
                    <button aria-label="Delete record" className="text-gray-400 hover:text-red-600" onClick={() => { if (window.confirm('Delete this record?')) void remove(r.id); }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 && <tr><td className="px-3 py-3 text-gray-500">No records.</td></tr>}
            </tbody>
          </table>
        </div>
        {hasMore && <Button onClick={() => void loadMore()}>Load more</Button>}
      </div>
    </PageLayout>
  );
}
