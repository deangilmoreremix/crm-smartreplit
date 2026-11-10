import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import InlineEditCell from './InlineEditCell';
import SavedViewsMenu from './SavedViewsMenu';
import ImportContactsModal from './ImportContactsModal';
import { ContactActivityTimeline } from './ContactActivityTimeline';
import ContactAttachments from './ContactAttachments';
import type { ContactDraft } from './ImportContactsModal.utils';

interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  status?: string | null;
}

interface Filters extends Record<string, unknown> {
  search: string;
  status: string;
  industry: string;
}

const EMPTY_FILTERS: Filters = { search: '', status: '', industry: '' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_OPTIONS = ['lead', 'prospect', 'active', 'customer', 'inactive'].map((s) => ({
  value: s,
  label: s,
}));

const fullName = (c: ApiContact) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

const ContactPanel: React.FC<{ contact: ApiContact; onClose: () => void }> = ({
  contact,
  onClose,
}) => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const id = String(contact.id);

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => !cancelled && setSignedIn(!!data.user))
      .catch(() => !cancelled && setSignedIn(false));
    return () => {
      cancelled = true;
    };
  }, []);

  let body: React.ReactNode;
  if (signedIn === null) body = <p className="text-sm text-gray-500">Loading...</p>;
  else if (!signedIn)
    body = <p className="text-sm text-gray-600">Sign in to view activity and attachments.</p>;
  else if (!UUID_RE.test(id))
    body = (
      <p className="text-sm text-gray-600">
        Activity and attachments are not available for this contact because it has no UUID.
      </p>
    );
  else
    body = (
      <>
        <ContactActivityTimeline contactId={id} />
        <h4 className="font-semibold mt-6 mb-2">Attachments</h4>
        <ContactAttachments contactId={id} />
      </>
    );

  return (
    <aside
      aria-label="Contact details"
      className="w-96 shrink-0 border-l bg-white p-4 overflow-y-auto"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{fullName(contact) || 'Unnamed contact'}</h3>
          <p className="text-sm text-gray-500">{contact.email}</p>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="text-gray-500">
          x
        </button>
      </div>
      {body}
    </aside>
  );
};

const ContactsManager: React.FC = () => {
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<ApiContact | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContacts(await api<ApiContact[]>('/api/contacts'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const industries = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.industry).filter(Boolean) as string[])).sort(),
    [contacts]
  );
  const statuses = useMemo(
    () =>
      Array.from(
        new Set([...STATUS_OPTIONS.map((o) => o.value), ...contacts.map((c) => c.status).filter(Boolean) as string[]])
      ),
    [contacts]
  );

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (!filters.status || c.status === filters.status) &&
        (!filters.industry || c.industry === filters.industry) &&
        (!q || [fullName(c), c.email, c.company].some((v) => (v ?? '').toLowerCase().includes(q)))
    );
  }, [contacts, filters]);

  const patch = async (c: ApiContact, updates: Partial<ApiContact>) => {
    const updated = await api<ApiContact>(`/api/contacts/${c.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...updated } : x)));
    setSelected((s) => (s && s.id === c.id ? { ...s, ...updated } : s));
  };

  const saveName = (c: ApiContact, value: string | number) => {
    const [first, ...rest] = String(value).trim().split(/\s+/);
    return patch(c, { firstName: first ?? '', lastName: rest.join(' ') });
  };

  const createContact = (d: ContactDraft) => {
    const [first, ...rest] = (d.name || '').trim().split(/\s+/);
    return api('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: d.firstName || first || '',
        lastName: d.lastName || rest.join(' ') || '',
        email: d.email,
        phone: d.phone,
        company: d.company,
        position: d.position,
        industry: d.industry,
        status: d.status,
        notes: d.notes,
        tags: d.tags,
      }),
    });
  };

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="search"
            placeholder="Search contacts"
            aria-label="Search contacts"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by industry"
            value={filters.industry}
            onChange={(e) => setFilter('industry', e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <SavedViewsMenu
            objectType="contacts"
            currentFilters={filters}
            onApply={(f) => setFilters({ ...EMPTY_FILTERS, ...f })}
          />
          <button
            onClick={() => setImportOpen(true)}
            className="ml-auto border rounded px-3 py-1.5 text-sm"
          >
            Import CSV
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading contacts...</p>
        ) : error ? (
          <div role="alert" className="text-sm text-red-600">
            {error}{' '}
            <button onClick={() => void load()} className="underline">
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-500">
            {contacts.length === 0
              ? 'No contacts yet. Import a CSV to get started.'
              : 'No contacts match the current filters.'}
          </p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Industry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="border-b cursor-pointer hover:bg-gray-50"
                >
                  <td className="py-2" onClick={(e) => e.stopPropagation()}>
                    <InlineEditCell
                      value={fullName(c)}
                      placeholder="Unnamed"
                      onSave={(v) => saveName(c, v)}
                    />
                  </td>
                  <td>{c.email}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <InlineEditCell
                      value={c.company}
                      onSave={(v) => patch(c, { company: String(v) })}
                    />
                  </td>
                  <td>{c.industry}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <InlineEditCell
                      type="select"
                      value={c.status}
                      options={statuses.map((s) => ({ value: s, label: s }))}
                      onSave={(v) => patch(c, { status: String(v) })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ContactPanel contact={selected} onClose={() => setSelected(null)} />}

      <ImportContactsModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onCreate={createContact}
        onComplete={() => void load()}
      />
    </div>
  );
};

export default ContactsManager;
