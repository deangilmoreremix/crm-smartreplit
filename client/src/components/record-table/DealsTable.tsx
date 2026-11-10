import React, { useMemo } from 'react';
import RecordTable from './RecordTable';
import { DEAL_STAGE_OPTIONS, dealsAdapter } from './adapters';
import { useApiList } from './useApiList';
import { useSafeNavigate } from './useSafeNavigate';
import type { RecordColumn } from './types';

interface DealRow {
  id: number | string;
  title: string;
  value?: string | number | null;
  stage?: string | null;
  probability?: number | null;
  status?: string | null;
  expectedCloseDate?: string | null;
  contactId?: number | null;
}

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Table view of /api/deals, shown next to the kanban board. */
const DealsTable: React.FC = () => {
  const { data, loading, error, reload, patchRow } = useApiList<DealRow>('/api/deals');
  const navigate = useSafeNavigate();

  const columns = useMemo<RecordColumn<DealRow>[]>(
    () => [
      { id: 'title', header: 'Deal', accessor: (d) => d.title, editable: true, width: 220 },
      {
        id: 'value',
        header: 'Value',
        accessor: (d) => (d.value === null || d.value === undefined ? null : Number(d.value)),
        type: 'number',
        editable: true,
        aggregate: 'sum',
        formatAggregate: money,
        render: (d) => (d.value === null || d.value === undefined ? '' : money(Number(d.value))),
        width: 130,
      },
      { id: 'stage', header: 'Stage', accessor: (d) => d.stage, type: 'select', options: DEAL_STAGE_OPTIONS, editable: true, width: 140 },
      { id: 'probability', header: 'Probability %', accessor: (d) => d.probability, type: 'number', aggregate: 'avg', formatAggregate: (n) => `${n.toFixed(0)}%`, width: 130 },
      { id: 'status', header: 'Status', accessor: (d) => d.status, width: 110 },
      {
        id: 'expectedCloseDate',
        header: 'Expected close',
        accessor: (d) => d.expectedCloseDate,
        type: 'date',
        render: (d) => (d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : ''),
      },
    ],
    []
  );

  return (
    <RecordTable<DealRow>
      data={data}
      columns={columns}
      getRowId={(d) => String(d.id)}
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      emptyMessage="No deals yet."
      objectType="deals"
      searchLabel="Search deals"
      exportName="deals"
      rowLabel={(d) => d.title}
      onCellEdit={(row, col, v) => patchRow(row, { [col.id]: col.id === 'value' ? String(v) : v })}
      bulkAdapter={dealsAdapter}
      onDataChanged={() => void reload()}
      rowMenu={(d) => [
        { label: 'Open record', onSelect: () => navigate(`/deals/${d.id}`) },
        { label: 'Add note', onSelect: () => navigate(`/deals/${d.id}?tab=notes`) },
        { label: 'Add task', onSelect: () => navigate(`/deals/${d.id}?tab=tasks`) },
      ]}
      drawer={{ title: (d) => d.title, subtitle: (d) => d.stage ?? undefined, openHref: (d) => `/deals/${d.id}` }}
    />
  );
};

export default DealsTable;
