import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, UserPlus } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { Button } from '../../components/ui/button';
import { useRoles, useTeam } from '../../hooks/useDataModel';

export default function TeamPage() {
  const { members, loading, error, invite, update, remove } = useTeam();
  const { roles } = useRoles();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setFormError(null);
    try { await invite(email.trim(), roleId || null); setEmail(''); } catch (err: any) { setFormError(err.message); }
    setBusy(false);
  };
  const act = (p: Promise<unknown>) => p.catch((e: any) => setFormError(e.message));

  return (
    <PageLayout title="Team" description="Invite people and assign roles." actions={<Link to="/settings/roles" className="text-sm text-blue-600 hover:underline">Manage roles</Link>}>
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-3">Members</h3>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : members.length === 0 ? (
            <p className="text-sm text-gray-500">No team members yet.</p>
          ) : (
            <ul className="divide-y">
              {members.map((m) => (
                <li key={m.id} className="py-2 flex flex-wrap items-center gap-3">
                  <span className="flex-1 min-w-[10rem]">{m.email ?? m.member_id}</span>
                  <select
                    aria-label="Role"
                    value={m.role_id ?? ''}
                    onChange={(e) => void act(update(m.id, { roleId: e.target.value || null }))}
                    className="p-1 border rounded-md text-sm"
                  >
                    <option value="">No role</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button
                    className="text-xs rounded px-2 py-0.5 bg-gray-100"
                    onClick={() => void act(update(m.id, { status: m.status === 'disabled' ? 'active' : 'disabled' }))}
                  >
                    {m.status === 'disabled' ? 'Disabled - enable' : m.status === 'active' ? 'Active - disable' : m.status}
                  </button>
                  <button aria-label="Remove member" className="text-gray-400 hover:text-red-600" onClick={() => { if (window.confirm(`Remove ${m.email}?`)) void act(remove(m.id)); }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-3">Invite</h3>
          <form onSubmit={onInvite} className="flex flex-wrap gap-3 items-end">
            <label className="text-sm">
              <span className="block text-gray-700 mb-1">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded-md" />
            </label>
            <label className="text-sm">
              <span className="block text-gray-700 mb-1">Role</span>
              <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="p-2 border rounded-md">
                <option value="">No role (no access)</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <Button type="submit" disabled={busy}><UserPlus className="h-4 w-4 mr-2" />{busy ? 'Inviting...' : 'Send invite'}</Button>
          </form>
          {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        </section>
      </div>
    </PageLayout>
  );
}
