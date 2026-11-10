import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { Button } from '../../components/ui/button';
import {
  FieldPerm, ObjectPerm, Role, STANDARD_OBJECTS, useFields, useObjects, useRoles,
} from '../../hooks/useDataModel';

const ACTIONS = ['can_read', 'can_create', 'can_update', 'can_delete'] as const;

function FieldPermissionEditor({
  objectType, fieldPerms, onChange,
}: { objectType: string; fieldPerms: FieldPerm[]; onChange: (p: FieldPerm[]) => void }) {
  const { fields } = useFields(objectType);
  if (fields.length === 0) return <p className="text-sm text-gray-500">No custom fields. Field-level rules apply to custom fields only.</p>;
  const get = (name: string) => fieldPerms.find((p) => p.object_type === objectType && p.field === name);
  const set = (name: string, patch: Partial<FieldPerm>) => {
    const cur = get(name) ?? { object_type: objectType, field: name, can_read: true, can_write: true };
    const next = { ...cur, ...patch };
    if (!next.can_read) next.can_write = false;
    onChange([...fieldPerms.filter((p) => !(p.object_type === objectType && p.field === name)), next]);
  };
  return (
    <table className="text-sm">
      <thead><tr className="text-left text-gray-500"><th className="pr-6">Field</th><th className="pr-4">Read</th><th>Write</th></tr></thead>
      <tbody>
        {fields.map((f) => {
          const p = get(f.name);
          return (
            <tr key={f.id}>
              <td className="pr-6 py-1">{f.label}</td>
              <td className="pr-4"><input type="checkbox" checked={p?.can_read ?? true} onChange={(e) => set(f.name, { can_read: e.target.checked })} /></td>
              <td><input type="checkbox" checked={p?.can_write ?? true} disabled={!(p?.can_read ?? true)} onChange={(e) => set(f.name, { can_write: e.target.checked })} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RoleEditor({ role, onSave, onDelete }: { role: Role; onSave: (r: Role) => Promise<void>; onDelete: () => void }) {
  const { objects } = useObjects();
  const [draft, setDraft] = useState<Role>(role);
  const [fieldObj, setFieldObj] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rows = useMemo(
    () => [
      ...STANDARD_OBJECTS.map((o) => ({ type: o as string, label: o })),
      ...objects.map((o) => ({ type: o.id, label: o.label_plural })),
    ],
    [objects]
  );
  const perm = (type: string): ObjectPerm =>
    draft.objectPermissions.find((p) => p.object_type === type) ??
    { object_type: type, can_read: false, can_create: false, can_update: false, can_delete: false };
  const toggle = (type: string, action: (typeof ACTIONS)[number], value: boolean) => {
    const next = { ...perm(type), [action]: value };
    if (action !== 'can_read' && value) next.can_read = true;
    if (action === 'can_read' && !value) { next.can_create = false; next.can_update = false; next.can_delete = false; }
    setDraft({ ...draft, objectPermissions: [...draft.objectPermissions.filter((p) => p.object_type !== type), next] });
  };

  const save = async () => {
    setSaving(true); setErr(null);
    try { await onSave(draft); } catch (e: any) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm flex-1 min-w-[12rem]">
          <span className="block text-gray-700 mb-1">Name</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full p-2 border rounded-md" />
        </label>
        <label className="text-sm flex-1 min-w-[12rem]">
          <span className="block text-gray-700 mb-1">Description</span>
          <input value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full p-2 border rounded-md" />
        </label>
        <button aria-label="Delete role" className="text-gray-400 hover:text-red-600 pb-2" onClick={() => { if (window.confirm(`Delete role ${role.name}?`)) onDelete(); }}><Trash2 size={18} /></button>
      </div>

      <table className="text-sm w-full">
        <thead><tr className="text-left text-gray-500"><th>Object</th><th>Read</th><th>Create</th><th>Update</th><th>Delete</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.type} className="border-t">
              <td className="py-1 capitalize">{r.label}</td>
              {ACTIONS.map((a) => (
                <td key={a}><input type="checkbox" aria-label={`${r.label} ${a}`} checked={perm(r.type)[a]} onChange={(e) => toggle(r.type, a, e.target.checked)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h4 className="font-medium text-sm mb-2">Field permissions</h4>
        <select value={fieldObj} onChange={(e) => setFieldObj(e.target.value)} className="p-2 border rounded-md text-sm mb-2">
          <option value="">Choose an object...</option>
          {rows.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
        </select>
        {fieldObj && (
          <FieldPermissionEditor
            objectType={fieldObj}
            fieldPerms={draft.fieldPermissions}
            onChange={(fp) => setDraft({ ...draft, fieldPermissions: fp })}
          />
        )}
        <p className="text-xs text-gray-500 mt-2">Read restrictions are applied by the API; direct database reads are only partly masked.</p>
      </div>

      <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save role'}</Button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

export default function RolesPage() {
  const { roles, loading, error, create, update, remove } = useRoles();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try { await create({ name: name.trim() }); setName(''); } catch (err: any) { setFormError(err.message); }
  };

  return (
    <PageLayout title="Roles" description="Control what team members can see and change.">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {roles.map((r) => (
          <RoleEditor
            key={r.id}
            role={r}
            onSave={(d) => update(r.id, { name: d.name, description: d.description, objectPermissions: d.objectPermissions, fieldPermissions: d.fieldPermissions })}
            onDelete={() => void remove(r.id)}
          />
        ))}
        <form onSubmit={onAdd} className="flex gap-2 items-end">
          <label className="text-sm">
            <span className="block text-gray-700 mb-1">New role</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales rep" className="p-2 border rounded-md" />
          </label>
          <Button type="submit"><Plus className="h-4 w-4 mr-2" />Add role</Button>
        </form>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>
    </PageLayout>
  );
}
