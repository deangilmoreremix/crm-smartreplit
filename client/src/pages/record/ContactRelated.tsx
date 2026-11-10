import React, { useCallback, useEffect, useState } from 'react';
import { RelatedList, json } from './RecordPage';

interface Company {
  id: string;
  name: string;
}
interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
}
interface ApiDeal {
  id: number | string;
  title: string;
  stage?: string | null;
  value?: string | number | null;
  contactId?: number | null;
}

const fullName = (c: ApiContact) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || `Contact ${c.id}`;

/**
 * Related tab for a contact, built from the CURRENT associations: the free-text `contacts.company`,
 * `deals.contactId`, plus the optional `company_id` link to a CRM company (additive; nothing is migrated).
 */
const ContactRelated: React.FC<{ contactId: string; companyText?: string }> = ({ contactId, companyText }) => {
  const [linked, setLinked] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [colleagues, setColleagues] = useState<ApiContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState('');

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      json<Company | null>(`/api/crm/contacts/${contactId}/company`),
      json<Company[]>('/api/crm/companies'),
      json<ApiDeal[]>('/api/deals'),
      json<ApiContact[]>('/api/contacts'),
    ]);
    if (results[0].status === 'fulfilled') setLinked(results[0].value);
    if (results[1].status === 'fulfilled') setCompanies(results[1].value);
    if (results[2].status === 'fulfilled') setDeals(results[2].value.filter((d) => String(d.contactId) === contactId));
    if (results[3].status === 'fulfilled') {
      const name = (companyText ?? '').trim().toLowerCase();
      setColleagues(
        name ? results[3].value.filter((c) => String(c.id) !== contactId && (c.company ?? '').trim().toLowerCase() === name) : []
      );
    }
  }, [contactId, companyText]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const link = (companyId: string) =>
    act(() => json(`/api/crm/companies/${companyId}/contacts`, { method: 'POST', body: JSON.stringify({ contactId: Number(contactId) }) }));
  const unlink = () => linked && act(() => json(`/api/crm/companies/${linked.id}/contacts/${contactId}`, { method: 'DELETE' }));
  const createFromText = () =>
    act(async () => {
      const created = await json<Company>('/api/crm/companies', { method: 'POST', body: JSON.stringify({ name: companyText }) });
      await json(`/api/crm/companies/${created.id}/contacts`, { method: 'POST', body: JSON.stringify({ contactId: Number(contactId) }) });
    });

  return (
    <div>
      {error && <p role="alert" className="text-sm text-red-600 mb-2">{error}</p>}
      <section className="mb-6">
        <h3 className="font-medium mb-2">Company</h3>
        <p className="text-sm text-gray-600 mb-2">Company (as typed on the contact): {companyText || <em>none</em>}</p>
        {linked ? (
          <p className="text-sm">
            Linked CRM company: <a className="text-blue-600 hover:underline" href={`/companies/${linked.id}`}>{linked.name}</a>{' '}
            <button type="button" onClick={() => void unlink()} className="text-xs text-red-600 underline">Unlink</button>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select aria-label="CRM company" value={choice} onChange={(e) => setChoice(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Link to a CRM company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" disabled={!choice} onClick={() => void link(choice)} className="px-2 py-1 border rounded disabled:opacity-50">Link</button>
            {companyText?.trim() && (
              <button type="button" onClick={() => void createFromText()} className="px-2 py-1 border rounded">
                Create "{companyText.trim()}" as CRM company
              </button>
            )}
          </div>
        )}
      </section>
      <RelatedList
        title="Deals"
        items={deals.map((d) => ({ id: String(d.id), label: d.title, href: `/deals/${d.id}`, meta: d.stage ?? undefined }))}
        empty="No deals linked to this contact."
      />
      <RelatedList
        title="Other contacts at the same company"
        items={colleagues.map((c) => ({ id: String(c.id), label: fullName(c), href: `/contacts/${c.id}` }))}
        empty={companyText ? 'No other contacts share this company.' : 'No company set.'}
      />
    </div>
  );
};

export default ContactRelated;
