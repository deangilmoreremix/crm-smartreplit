import React, { useMemo } from 'react';
import RecordTable from './RecordTable';
import { DEAL_STAGE_OPTIONS, dealsAdapter } from './adapters';
import { useApiList } from './useApiList';
import { useSafeNavigate } from './useSafeNavigate';
import type { BulkAdapter, BulkResult, RecordColumn } from './types';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import { useDealStore, fromApiStage, toApiStage } from '../../store/dealStore';
import SampleBadge from '../SampleBadge';

interface DealRow {
  id: number | string;
  title: string;
  value?: string | number | null;
  stage?: string | null;
  probability?: number | null;
  status?: string | null;
  expectedCloseDate?: string | null;
  contactId?: number | null;
  /** Sample row (local only, never sent to the server). */
  isDemo?: boolean;
}

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Table view of /api/deals, shown next to the kanban board. */
const DealsTable: React.FC = () => {
  const { data: realData, loading, error, reload, patchRow } = useApiList<DealRow>('/api/deals');
  const navigate = useSafeNavigate();
  const { showDemoData } = useDemoDataSafe();
  const demoDeals = useDealStore((s) => s.demoDeals);

  // Sample deals are listed after the real ones (only while demo data is enabled).
  const data = useMemo<DealRow[]>(
    () => [
      ...realData,
      ...(showDemoData
        ? demoDeals.map<DealRow>((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            stage: toApiStage(d.stage.id, d.qualificationStage),
            probability: d.probability,
            status: 'sample',
            expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
            isDemo: true,
          }))
        : []),
    ],
    [realData, demoDeals, showDemoData]
  );

  /** Applies a table edit to a sample deal in the store only. */
  const editDemoRow = async (row: DealRow, patch: Record<string, unknown>) => {
    const { moveDeal, updateDeal } = useDealStore.getState();
    const { stage, ...rest } = patch;
    if (typeof stage === 'string') await moveDeal(String(row.id), fromApiStage(stage));
    const fields: Record<string, unknown> = { ...rest };
    if ('value' in fields) fields.value = Number(fields.value) || 0;
    if (Object.keys(fields).length) await updateDeal(String(row.id), fields);
  };

  // Bulk actions: sample rows are handled locally, real rows go through the REST adapter.
  const bulkAdapter = useMemo<BulkAdapter<DealRow>>(() => {
    const split = async (
      rows: DealRow[],
      real: (rows: DealRow[]) => Promise<BulkResult>,
      demo: (row: DealRow) => Promise<unknown>
    ): Promise<BulkResult> => {
      const demoRows = rows.filter((r) => r.isDemo);
      const realRows = rows.filter((r) => !r.isDemo);
      await Promise.all(demoRows.map(demo));
      const result = realRows.length ? await real(realRows) : { succeeded: 0, errors: [] };
      return { succeeded: result.succeeded + demoRows.length, errors: result.errors };
    };
    return {
      ...dealsAdapter,
      updateMany: (rows, patch) =>
        split(rows, (r) => dealsAdapter.updateMany(r, patch), (r) => editDemoRow(r, patch)),
      deleteMany: (rows) =>
        split(rows, (r) => dealsAdapter.deleteMany(r), (r) => useDealStore.getState().deleteDeal(String(r.id))),
    };
  }, []);

  const columns = useMemo<RecordColumn<DealRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Deal',
        accessor: (d) => d.title,
        render: (d) => (
          <span className="inline-flex items-center gap-2">
            {d.title}
            {d.isDemo && <SampleBadge />}
          </span>
        ),
        editable: true,
        width: 220,
      },
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
      onCellEdit={(row, col, v) =>
        row.isDemo
          ? editDemoRow(row, { [col.id]: v })
          : patchRow(row, { [col.id]: col.id === 'value' ? String(v) : v })
      }
      bulkAdapter={bulkAdapter}
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
