import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RecordPage, { FieldDef, RelatedList, json } from './RecordPage';
import { DEAL_STAGE_OPTIONS } from '../../components/record-table/adapters';
import { isDemoId } from '../../data/demoData';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import { useDealStore, toApiStage } from '../../store/dealStore';
import SampleBadge from '../../components/SampleBadge';

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

/** Read-only page for a sample deal: never calls the server (no deal, note, task or timeline requests). */
const DemoDealRecord: React.FC<{ id: string }> = ({ id }) => {
  const { showDemoData } = useDemoDataSafe();
  const deal = useDealStore((s) => s.demoDeals.find((d) => d.id === id));
  if (!showDemoData || !deal) {
    return (
      <div className="p-8" role="alert">
        <p className="text-red-700">Sample record not available.</p>
        <Link to="/pipeline" className="text-blue-600 text-sm">Back to Pipeline</Link>
      </div>
    );
  }
  const rows: Array<[string, string]> = [
    ['Title', deal.title],
    ['Value', `$${deal.value.toLocaleString()}`],
    ['Stage', toApiStage(deal.stage.id, deal.qualificationStage)],
    ['Probability %', String(deal.probability)],
    ['Description', deal.description ?? '-'],
  ];
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to="/pipeline" className="text-sm text-gray-500 hover:text-gray-700">← Pipeline</Link>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
        {deal.title} <SampleBadge />
      </h1>
      <p role="note" className="mt-3 mb-6 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        Sample record — not saved. It is example data and can be hidden with Clear Demo Data.
      </p>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const DealRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  return isDemoId(id) ? <DemoDealRecord id={id} /> : <RealDealRecord id={id} />;
};

const RealDealRecord: React.FC<{ id: string }> = ({ id }) => {
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
