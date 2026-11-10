import React, { useMemo } from 'react';
import RecordTable from './RecordTable';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, tasksAdapter } from './adapters';
import { useApiList } from './useApiList';
import { useSafeNavigate } from './useSafeNavigate';
import type { RecordColumn } from './types';

interface TaskRow {
  id: number | string;
  title: string;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  contactId?: number | null;
  dealId?: number | null;
  assignedTo?: string | null;
}

/** Table view of /api/tasks, shown next to the kanban/calendar views. */
const TasksTable: React.FC = () => {
  const { data, loading, error, reload, patchRow } = useApiList<TaskRow>('/api/tasks');
  const navigate = useSafeNavigate();

  const columns = useMemo<RecordColumn<TaskRow>[]>(
    () => [
      { id: 'title', header: 'Task', accessor: (t) => t.title, editable: true, width: 260 },
      { id: 'status', header: 'Status', accessor: (t) => t.status, type: 'select', options: TASK_STATUS_OPTIONS, editable: true, width: 130 },
      { id: 'priority', header: 'Priority', accessor: (t) => t.priority, type: 'select', options: TASK_PRIORITY_OPTIONS, editable: true, width: 110 },
      {
        id: 'dueDate',
        header: 'Due',
        accessor: (t) => t.dueDate,
        type: 'date',
        render: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''),
      },
      { id: 'contactId', header: 'Contact', accessor: (t) => t.contactId, hideByDefault: true },
      { id: 'dealId', header: 'Deal', accessor: (t) => t.dealId, hideByDefault: true },
    ],
    []
  );

  return (
    <RecordTable<TaskRow>
      data={data}
      columns={columns}
      getRowId={(t) => String(t.id)}
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      emptyMessage="No tasks yet."
      objectType="tasks"
      searchLabel="Search tasks"
      exportName="tasks"
      rowLabel={(t) => t.title}
      onCellEdit={(row, col, v) => patchRow(row, { [col.id]: v })}
      bulkAdapter={tasksAdapter}
      onDataChanged={() => void reload()}
      rowMenu={(t) => [
        { label: 'Mark complete', disabled: t.status === 'completed', onSelect: () => void patchRow(t, { status: 'completed' }) },
        ...(t.contactId ? [{ label: 'Open contact', onSelect: () => navigate(`/contacts/${t.contactId}`) }] : []),
        ...(t.dealId ? [{ label: 'Open deal', onSelect: () => navigate(`/deals/${t.dealId}`) }] : []),
      ]}
      drawer={{ title: (t) => t.title, subtitle: (t) => t.status ?? undefined }}
    />
  );
};

export default TasksTable;
