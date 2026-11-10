import React, { useMemo, useState } from 'react';
import RecordTable from '../../components/record-table/RecordTable';
import { createRestAdapter } from '../../components/record-table/bulkAdapter';
import { useApiList } from '../../components/record-table/useApiList';
import { useSafeNavigate } from '../../components/record-table/useSafeNavigate';
import type { RecordColumn } from '../../components/record-table/types';

interface CompanyRow {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  contactCount?: number;
  createdAt?: string | null;
}

const adapter = createRestAdapter<CompanyRow>({
  basePath: '/api/crm/companies',
  editFields: [
    { id: 'industry', label: 'Industry' },
    { id: 'size', label: 'Size' },
  ],
});

const CompaniesPage: React.FC = () => {
  const { data, loading, error, reload, patchRow } = useApiList<CompanyRow>('/api/crm/companies');
  const navigate = useSafeNavigate();
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const columns = useMemo<RecordColumn<CompanyRow>[]>(
    () => [
      { id: 'name', header: 'Name', accessor: (c) => c.name, editable: true, width: 220 },
      { id: 'domain', header: 'Domain', accessor: (c) => c.domain, editable: true },
      { id: 'industry', header: 'Industry', accessor: (c) => c.industry, editable: true },
      { id: 'size', header: 'Size', accessor: (c) => c.size, editable: true, width: 110 },
      { id: 'contactCount', header: 'Contacts', accessor: (c) => c.contactCount ?? 0, type: 'number', aggregate: 'sum', width: 110 },
      { id: 'createdAt', header: 'Created', accessor: (c) => c.createdAt, type: 'date', hideByDefault: true },
    ],
    []
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError(null);
    try {
      const res = await fetch('/api/crm/companies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setName('');
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create company');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Companies</h1>
        <form onSubmit={create} className="flex gap-2 items-center">
          <input aria-label="New company name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New company name" className="border rounded px-2 py-1 text-sm" />
          <button type="submit" disabled={!name.trim()} className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50">Add</button>
        </form>
      </div>
      {createError && <p role="alert" className="px-4 text-sm text-red-600">{createError}</p>}
      <div className="flex-1 min-h-0">
        <RecordTable<CompanyRow>
          data={data}
          columns={columns}
          getRowId={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={() => void reload()}
          emptyMessage="No companies yet."
          objectType="companies"
          searchLabel="Search companies"
          exportName="companies"
          rowLabel={(c) => c.name}
          onCellEdit={(row, col, v) => patchRow(row, { [col.id]: v })}
          bulkAdapter={adapter}
          onDataChanged={() => void reload()}
          rowMenu={(c) => [
            { label: 'Open record', onSelect: () => navigate(`/companies/${c.id}`) },
            { label: 'Add note', onSelect: () => navigate(`/companies/${c.id}?tab=notes`) },
            { label: 'Add task', onSelect: () => navigate(`/companies/${c.id}?tab=tasks`) },
          ]}
          drawer={{ title: (c) => c.name, subtitle: (c) => c.domain ?? undefined, openHref: (c) => `/companies/${c.id}` }}
        />
      </div>
    </div>
  );
};

export default CompaniesPage;
