import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecordPage, { FieldDef, RelatedList, json } from './RecordPage';

interface Company {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  phone?: string | null;
  address?: Record<string, string>;
  createdAt?: string;
}
interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
}

const nameOf = (c: ApiContact) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email || `Contact ${c.id}`;

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'domain', label: 'Domain' },
  { key: 'industry', label: 'Industry' },
  { key: 'size', label: 'Size' },
  { key: 'phone', label: 'Phone' },
  { key: 'createdAt', label: 'Created', readOnly: true, format: (v) => (v ? new Date(String(v)).toLocaleDateString() : '-') },
];

const CompanyRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [candidates, setCandidates] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const c = await json<Company>(`/api/crm/companies/${id}`);
      setCompany(c);
      setError(null);
      const [linked, all] = await Promise.all([
        json<ApiContact[]>(`/api/crm/companies/${id}/contacts`),
        json<ApiContact[]>('/api/contacts').catch(() => [] as ApiContact[]),
      ]);
      setContacts(linked);
      const linkedIds = new Set(linked.map((l) => String(l.id)));
      const name = c.name.trim().toLowerCase();
      // Existing contacts whose free-text company matches this name: offered as one-click links.
      setCandidates(all.filter((x) => !linkedIds.has(String(x.id)) && (x.company ?? '').trim().toLowerCase() === name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (key: string, value: string | number) => {
    const updated = await json<Company>(`/api/crm/companies/${id}`, { method: 'PUT', body: JSON.stringify({ [key]: value }) });
    setCompany(updated);
  };
  const linkContact = async (contactId: string | number) => {
    await json(`/api/crm/companies/${id}/contacts`, { method: 'POST', body: JSON.stringify({ contactId: Number(contactId) }) });
    await load();
  };
  const remove = async () => {
    if (!window.confirm('Delete this company? Linked contacts are kept.')) return;
    await json(`/api/crm/companies/${id}`, { method: 'DELETE' });
    navigate('/companies');
  };

  const related = useMemo(
    () => (
      <div>
        <RelatedList
          title="Contacts"
          items={contacts.map((c) => ({ id: String(c.id), label: nameOf(c), href: `/contacts/${c.id}`, meta: c.email ?? undefined }))}
          empty="No contacts are linked to this company yet."
        />
        {candidates.length > 0 && (
          <section>
            <h3 className="font-medium mb-2">Contacts that list "{company?.name}" as their company</h3>
            <ul className="space-y-1 text-sm">
              {candidates.map((c) => (
                <li key={c.id}>
                  {nameOf(c)}{' '}
                  <button type="button" onClick={() => void linkContact(c.id)} className="text-blue-600 underline text-xs">
                    Link
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contacts, candidates, company?.name]
  );

  return (
    <RecordPage
      objectType="company"
      recordId={id}
      title={company?.name ?? 'Company'}
      subtitle={[company?.industry, company?.domain].filter(Boolean).join(' · ')}
      backHref="/companies"
      backLabel="Companies"
      record={company as unknown as Record<string, unknown> | null}
      loading={loading}
      error={error}
      fields={FIELDS}
      onSaveField={save}
      related={related}
      headerActions={
        <button type="button" onClick={() => void remove()} className="px-3 py-1.5 text-sm text-white bg-red-600 rounded">
          Delete
        </button>
      }
    />
  );
};

export default CompanyRecord;
