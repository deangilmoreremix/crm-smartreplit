import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import RecordPage, { FieldDef, RelatedList, json } from './RecordPage';
import { DEAL_STAGE_OPTIONS } from '../../components/record-table/adapters';

interface Deal {
  id: number;
  title: string;
  value?: string | number | null;
  stage?: string | null;
  probability?: number | null;
  status?: string | null;
  description?: string | null;
  contactId?: number | null;
}
interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
}

const FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'value', label: 'Value', type: 'number' },
  { key: 'stage', label: 'Stage', type: 'select', options: DEAL_STAGE_OPTIONS },
  { key: 'probability', label: 'Probability %', type: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
];

const DealRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<ApiContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await json<Deal>(`/api/deals/${id}`);
      setDeal(d);
      setError(null);
      if (d.contactId) {
        const all = await json<ApiContact[]>('/api/contacts').catch(() => [] as ApiContact[]);
        setContact(all.find((c) => String(c.id) === String(d.contactId)) ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (key: string, value: string | number) => {
    const updated = await json<Deal>(`/api/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ [key]: key === 'value' ? String(value) : value }),
    });
    setDeal((d) => (d ? { ...d, ...updated } : d));
  };

  const contactName = contact ? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || contact.email || `Contact ${contact.id}` : '';

  return (
    <RecordPage
      objectType="deal"
      recordId={id}
      title={deal?.title ?? 'Deal'}
      subtitle={deal?.stage ?? undefined}
      backHref="/pipeline"
      backLabel="Pipeline"
      record={deal as unknown as Record<string, unknown> | null}
      loading={loading}
      error={error}
      fields={FIELDS}
      onSaveField={save}
      related={
        <div>
          <RelatedList
            title="Contact"
            items={contact ? [{ id: String(contact.id), label: contactName, href: `/contacts/${contact.id}`, meta: contact.email ?? undefined }] : []}
            empty="No contact linked to this deal."
          />
          <RelatedList
            title="Company (from the contact)"
            items={contact?.company ? [{ id: 'c', label: contact.company }] : []}
            empty="No company on the linked contact."
          />
        </div>
      }
    />
  );
};

export default DealRecord;
