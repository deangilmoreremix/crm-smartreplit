import React from 'react';
import {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterOperator,
  NO_VALUE_OPERATORS,
  OPERATOR_LABELS,
} from './filters';
import type { RecordColumn } from './types';

interface Props<T> {
  columns: RecordColumn<T>[];
  value: FilterGroup;
  onChange: (next: FilterGroup) => void;
}

const OPERATORS: FilterOperator[] = Object.keys(OPERATOR_LABELS) as FilterOperator[];

function GroupEditor<T>({
  columns,
  group,
  onChange,
  onRemove,
  depth,
}: {
  columns: RecordColumn<T>[];
  group: FilterGroup;
  onChange: (g: FilterGroup) => void;
  onRemove?: () => void;
  depth: number;
}) {
  const setChild = (i: number, node: FilterNode | null) =>
    onChange({ ...group, children: group.children.flatMap((c, idx) => (idx !== i ? [c] : node ? [node] : [])) });
  const addCondition = () =>
    onChange({
      ...group,
      children: [...group.children, { type: 'condition', field: columns[0]?.id ?? '', operator: 'contains', value: '' }],
    });

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-4 border-l-2 pl-3' : ''}`}>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Match</span>
        <select
          aria-label="Group operator"
          value={group.op}
          onChange={(e) => onChange({ ...group, op: e.target.value as 'and' | 'or' })}
          className="border rounded px-1 py-0.5"
        >
          <option value="and">all (AND)</option>
          <option value="or">any (OR)</option>
        </select>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-red-600 ml-auto">
            Remove group
          </button>
        )}
      </div>
      {group.children.map((child, i) =>
        child.type === 'group' ? (
          <GroupEditor
            key={i}
            columns={columns}
            group={child}
            depth={depth + 1}
            onChange={(g) => setChild(i, g)}
            onRemove={() => setChild(i, null)}
          />
        ) : (
          <ConditionEditor key={i} columns={columns} cond={child} onChange={(c) => setChild(i, c)} onRemove={() => setChild(i, null)} />
        )
      )}
      <div className="flex gap-3 text-xs">
        <button type="button" onClick={addCondition} className="text-blue-600">
          + Add filter
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...group, children: [...group.children, { type: 'group', op: group.op === 'and' ? 'or' : 'and', children: [] }] })}
          className="text-blue-600"
        >
          + Add group
        </button>
      </div>
    </div>
  );
}

function ConditionEditor<T>({
  columns,
  cond,
  onChange,
  onRemove,
}: {
  columns: RecordColumn<T>[];
  cond: FilterCondition;
  onChange: (c: FilterCondition) => void;
  onRemove: () => void;
}) {
  const col = columns.find((c) => c.id === cond.field);
  const noValue = NO_VALUE_OPERATORS.includes(cond.operator);
  return (
    <div className="flex items-center gap-1">
      <select
        aria-label="Filter field"
        value={cond.field}
        onChange={(e) => onChange({ ...cond, field: e.target.value, value: '' })}
        className="border rounded px-1 py-0.5 text-sm"
      >
        {columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.header}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter operator"
        value={cond.operator}
        onChange={(e) => onChange({ ...cond, operator: e.target.value as FilterOperator })}
        className="border rounded px-1 py-0.5 text-sm"
      >
        {OPERATORS.map((o) => (
          <option key={o} value={o}>
            {OPERATOR_LABELS[o]}
          </option>
        ))}
      </select>
      {!noValue &&
        (col?.type === 'select' && col.options && cond.operator !== 'in' ? (
          <select
            aria-label="Filter value"
            value={String(cond.value ?? '')}
            onChange={(e) => onChange({ ...cond, value: e.target.value })}
            className="border rounded px-1 py-0.5 text-sm"
          >
            <option value="">Select...</option>
            {col.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            aria-label="Filter value"
            type={col?.type === 'number' ? 'number' : col?.type === 'date' ? 'date' : 'text'}
            value={String(cond.value ?? '')}
            placeholder={cond.operator === 'in' ? 'a, b, c' : 'Value'}
            onChange={(e) => onChange({ ...cond, value: e.target.value })}
            className="border rounded px-1 py-0.5 text-sm w-36"
          />
        ))}
      <button type="button" aria-label="Remove filter" onClick={onRemove} className="text-gray-400 hover:text-red-600 px-1">
        ×
      </button>
    </div>
  );
}

function FilterBuilder<T>({ columns, value, onChange }: Props<T>) {
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm">
      <GroupEditor columns={columns} group={value} onChange={onChange} depth={0} />
    </div>
  );
}

export default FilterBuilder;
