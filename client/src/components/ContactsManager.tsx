import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RecordTable, contactsAdapter, useSafeNavigate } from './record-table';
import type { RecordColumn } from './record-table';
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
  phone?: string | null;
  tags?: string[] | null;
  createdAt?: string | null;
}

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

const ContactPanelBody: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then((res: { data: { user: unknown } }) => !cancelled && setSignedIn(!!res.data.user))
      .catch(() => !cancelled && setSignedIn(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (signedIn === null) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!signedIn) return <p className="text-sm text-gray-600">Sign in to view activity and attachments.</p>;
  return (
    <>
      <ContactActivityTimeline contactId={contactId} />
      <h4 className="font-semibold mt-6 mb-2">Attachments</h4>
      <ContactAttachments contactId={contactId} />
    </>
  );
};

const ContactsManager: React.FC = () => {
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useSafeNavigate();

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

  const statuses = useMemo(
    () => [
      ...STATUS_OPTIONS,
      ...Array.from(new Set(contacts.map((c) => c.status).filter(Boolean) as string[]))
        .filter((s) => !STATUS_OPTIONS.some((o) => o.value === s))
        .map((s) => ({ value: s, label: s })),
    ],
    [contacts]
  );

  const columns = useMemo<RecordColumn<ApiContact>[]>(
    () => [
      { id: 'name', header: 'Name', accessor: fullName, editable: true, width: 200 },
      { id: 'email', header: 'Email', accessor: (c) => c.email, width: 220 },
      { id: 'company', header: 'Company', accessor: (c) => c.company, editable: true },
      { id: 'industry', header: 'Industry', accessor: (c) => c.industry },
      { id: 'status', header: 'Status', accessor: (c) => c.status, type: 'select', options: statuses, editable: true, width: 130 },
      { id: 'phone', header: 'Phone', accessor: (c) => c.phone, hideByDefault: true },
      { id: 'tags', header: 'Tags', accessor: (c) => c.tags ?? [], hideByDefault: true },
      { id: 'createdAt', header: 'Created', accessor: (c) => c.createdAt, type: 'date', hideByDefault: true },
    ],
    [statuses]
  );

  const patch = async (c: ApiContact, updates: Partial<ApiContact>) => {
    const updated = await api<ApiContact>(`/api/contacts/${c.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...updated } : x)));
  };

  const onCellEdit = (c: ApiContact, col: RecordColumn<ApiContact>, value: string | number) => {
    if (col.id === 'name') {
      const [first, ...rest] = String(value).trim().split(/\s+/);
      return patch(c, { firstName: first ?? '', lastName: rest.join(' ') });
    }
    return patch(c, { [col.id]: String(value) });
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

  return (
    <div className="h-full">
      <RecordTable<ApiContact>
        data={contacts}
        columns={columns}
        getRowId={(c) => String(c.id)}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        emptyMessage="No contacts yet. Import a CSV or Excel file to get started."
        objectType="contacts"
        searchLabel="Search contacts"
        exportName="contacts"
        rowLabel={(c) => fullName(c) || c.email || String(c.id)}
        onCellEdit={onCellEdit}
        bulkAdapter={contactsAdapter}
        onDataChanged={() => void load()}
        rowMenu={(c) => [
          { label: 'Open record', onSelect: () => navigate(`/contacts/${c.id}`) },
          { label: 'Add task', onSelect: () => navigate(`/contacts/${c.id}?tab=tasks`) },
          { label: 'Add note', onSelect: () => navigate(`/contacts/${c.id}?tab=notes`) },
        ]}
        drawer={{
          title: (c) => fullName(c) || 'Unnamed contact',
          subtitle: (c) => c.email ?? undefined,
          openHref: (c) => `/contacts/${c.id}`,
          render: (c) => <ContactPanelBody contactId={String(c.id)} />,
        }}
        toolbarExtra={
          <button onClick={() => setImportOpen(true)} className="border rounded px-3 py-1.5 text-sm">
            Import CSV / Excel
          </button>
        }
      />

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
