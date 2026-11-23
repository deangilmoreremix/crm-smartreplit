import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RecordTable, contactsAdapter, useSafeNavigate } from './record-table';
import type { BulkAdapter, BulkResult, RecordColumn } from './record-table';
import { useDemoDataSafe } from '../contexts/DemoDataContext';
import { useContactStore } from '../hooks/useContactStore';
import SampleBadge from './SampleBadge';
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
  /** Sample row (local only, never sent to the server). */
  isDemo?: boolean;
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
  const { showDemoData } = useDemoDataSafe();
  const storeContacts = useContactStore((s) => s.contacts);

  // Sample contacts are listed after the real ones (only while demo data is enabled).
  const rows = useMemo<ApiContact[]>(
    () => [
      ...contacts,
      ...(showDemoData
        ? Object.values(storeContacts)
            .filter((c) => c.isDemo)
            .map<ApiContact>((c) => ({
              id: `demo-${c.id}`,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              company: c.company,
              industry: c.industry,
              status: c.status,
              phone: c.phone,
              isDemo: true,
            }))
        : []),
    ],
    [contacts, storeContacts, showDemoData]
  );
  const storeId = (c: ApiContact) => String(c.id).replace(/^demo-/, '');

  // Deep links: ?new=1 opens the create dialog, ?search=1 focuses the search box.
  const inRouter = useInRouterContext();
  // The router context never changes for a mounted component, so the hook order is stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const routerLocation = inRouter ? useLocation() : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const routerNavigate = inRouter ? useNavigate() : null;
  const urlSearch = routerLocation?.search ?? '';
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSaving, setCreateSaving] = useState(false);

  const clearParam = (name: string) => {
    if (!routerLocation || !routerNavigate) return;
    const params = new URLSearchParams(routerLocation.search);
    params.delete(name);
    const qs = params.toString();
    routerNavigate(`${routerLocation.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
  };

  useEffect(() => {
    if (new URLSearchParams(urlSearch).get('new') === '1') {
      setCreateOpen(true);
      clearParam('new');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  useEffect(() => {
    if (loading || new URLSearchParams(urlSearch).get('search') !== '1') return;
    document.querySelector<HTMLInputElement>('input[aria-label="Search contacts"]')?.focus();
    clearParam('search');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, loading]);

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
      {
        id: 'name',
        header: 'Name',
        accessor: fullName,
        render: (c) => (
          <span className="inline-flex items-center gap-2">
            {fullName(c)}
            {c.isDemo && <SampleBadge />}
          </span>
        ),
        editable: true,
        width: 200,
      },
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

  /** Applies a table edit to a sample contact in the store only. */
  const editDemoRow = async (c: ApiContact, updates: Partial<ApiContact>) => {
    const { firstName, lastName, ...rest } = updates;
    useContactStore.getState().updateContact(storeId(c), {
      ...rest,
      ...(firstName !== undefined ? { firstName: firstName ?? '' } : {}),
      ...(lastName !== undefined ? { lastName: lastName ?? '' } : {}),
    } as never);
  };

  // Bulk actions: sample rows are handled locally, real rows go through the REST adapter.
  const bulkAdapter = useMemo<BulkAdapter<ApiContact>>(() => {
    const split = async (
      list: ApiContact[],
      real: (rows: ApiContact[]) => Promise<BulkResult>,
      demo: (row: ApiContact) => Promise<unknown>
    ): Promise<BulkResult> => {
      const demoRows = list.filter((r) => r.isDemo);
      const realRows = list.filter((r) => !r.isDemo);
      await Promise.all(demoRows.map(demo));
      const result = realRows.length ? await real(realRows) : { succeeded: 0, errors: [] };
      return { succeeded: result.succeeded + demoRows.length, errors: result.errors };
    };
    // Tagging/owner assignment/merge only exist on the server, so sample rows are reported as skipped.
    const sampleSkipped = (rows: ApiContact[]) =>
      rows.filter((r) => r.isDemo).map((r) => ({ id: String(r.id), message: 'Sample contacts cannot be changed this way' }));
    const serverOnly = async (
      list: ApiContact[],
      real: (rows: ApiContact[]) => Promise<BulkResult>
    ): Promise<BulkResult> => {
      const realRows = list.filter((r) => !r.isDemo);
      const result = realRows.length ? await real(realRows) : { succeeded: 0, errors: [] };
      return { succeeded: result.succeeded, errors: [...result.errors, ...sampleSkipped(list)] };
    };
    return {
      ...contactsAdapter,
      ...(contactsAdapter.addTag
        ? { addTag: (list: ApiContact[], tag: string) => serverOnly(list, (r) => contactsAdapter.addTag!(r, tag)) }
        : {}),
      ...(contactsAdapter.assignOwner
        ? { assignOwner: (list: ApiContact[], ownerId: string) => serverOnly(list, (r) => contactsAdapter.assignOwner!(r, ownerId)) }
        : {}),
      ...(contactsAdapter.merge
        ? {
            merge: async (primary: ApiContact, duplicate: ApiContact) => {
              if (primary.isDemo || duplicate.isDemo) throw new Error('Sample contacts cannot be merged');
              await contactsAdapter.merge!(primary, duplicate);
            },
          }
        : {}),
      updateMany: (list, patchValues) =>
        split(list, (r) => contactsAdapter.updateMany(r, patchValues), (r) => editDemoRow(r, patchValues as Partial<ApiContact>)),
      deleteMany: (list) =>
        split(list, (r) => contactsAdapter.deleteMany(r), async (r) => useContactStore.getState().deleteContact(storeId(r))),
    };
  }, []);

  const onCellEdit = (c: ApiContact, col: RecordColumn<ApiContact>, value: string | number) => {
    if (c.isDemo) {
      if (col.id === 'name') {
        const [first, ...rest] = String(value).trim().split(/\s+/);
        return editDemoRow(c, { firstName: first ?? '', lastName: rest.join(' ') });
      }
      return editDemoRow(c, { [col.id]: String(value) });
    }
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

  const submitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (k: string) => String(form.get(k) ?? '').trim();
    setCreateSaving(true);
    setCreateError(null);
    try {
      await api('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: field('firstName'),
          lastName: field('lastName'),
          email: field('email'),
          phone: field('phone'),
          company: field('company'),
        }),
      });
      setCreateOpen(false);
      void load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="h-full">
      <RecordTable<ApiContact>
        data={rows}
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
        bulkAdapter={bulkAdapter}
        onDataChanged={() => void load()}
        rowMenu={(c) =>
          c.isDemo
            ? []
            : [
          { label: 'Open record', onSelect: () => navigate(`/contacts/${c.id}`) },
          { label: 'Add task', onSelect: () => navigate(`/contacts/${c.id}?tab=tasks`) },
          { label: 'Add note', onSelect: () => navigate(`/contacts/${c.id}?tab=notes`) },
              ]
        }
        drawer={{
          title: (c) => fullName(c) || 'Unnamed contact',
          subtitle: (c) => c.email ?? undefined,
          openHref: (c) => (c.isDemo ? '/contacts' : `/contacts/${c.id}`),
          render: (c) =>
            c.isDemo ? (
              <p className="text-sm text-gray-600">Sample contact — clear sample data in the dashboard settings, or add a real contact.</p>
            ) : (
              <ContactPanelBody contactId={String(c.id)} />
            ),
        }}
        toolbarExtra={
          <button onClick={() => setImportOpen(true)} className="border rounded px-3 py-1.5 text-sm">
            Import CSV / Excel
          </button>
        }
      />

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form
            role="dialog"
            aria-label="New contact"
            onSubmit={submitCreate}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 max-w-full mx-4 space-y-3"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New contact</h3>
            {(['firstName', 'lastName', 'email', 'phone', 'company'] as const).map((name) => (
              <input
                key={name}
                name={name}
                type={name === 'email' ? 'email' : 'text'}
                required={name === 'firstName'}
                placeholder={{ firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone', company: 'Company' }[name]}
                aria-label={name}
                className="w-full border rounded px-3 py-1.5 text-sm"
              />
            ))}
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="border rounded px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={createSaving} className="border rounded px-3 py-1.5 text-sm bg-indigo-600 text-white">
                {createSaving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

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
