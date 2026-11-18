import React, { useMemo, useState } from 'react';
import { KanbanBoard, KanbanCard, ViewSwitcher, FilterBuilder } from '../../twenty-integration';
import { useContactStore } from '../../hooks/useContactStore';
import { applyFilters, type FilterCondition } from './applyFilters';

type BoardView = 'table' | 'kanban' | 'calendar';

const BASE_STATUSES = ['lead', 'prospect', 'customer', 'churned'];

const FIELDS = [
  { key: 'name', label: 'Name', type: 'FULL_NAME' },
  { key: 'company', label: 'Company', type: 'TEXT' },
  { key: 'email', label: 'Email', type: 'EMAILS' },
  { key: 'status', label: 'Status', type: 'SELECT' },
  { key: 'interestLevel', label: 'Interest', type: 'SELECT' },
];

/** Twenty-style board for contacts: filters + table/kanban views over the local contact store. */
const ContactsBoard: React.FC = () => {
  const { contacts, updateContact } = useContactStore();
  const [view, setView] = useState<BoardView>('kanban');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const all = useMemo(() => Object.values(contacts), [contacts]);
  const statuses = useMemo(
    () => Array.from(new Set([...BASE_STATUSES, ...all.map((c) => c.status).filter(Boolean)])),
    [all]
  );
  const rows = useMemo(() => applyFilters(all as any[], conditions), [all, conditions]);

  const columns = statuses.map((status) => ({
    id: status,
    title: status.charAt(0).toUpperCase() + status.slice(1),
    value: status,
    count: rows.filter((row) => row.status === status).length,
  }));

  const cards = rows.map((row, index) => ({ id: row.id, title: row.name, data: row, position: index }));

  const statusSelect = (contactId: string, status: string) => (
    <select
      aria-label="Change status"
      value={status}
      onChange={(e) => updateContact(contactId, { status: e.target.value })}
      className="w-full h-8 rounded border border-gray-300 px-2 text-xs"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Contacts board</h2>
        <ViewSwitcher value={view} onChange={setView} />
      </div>
      <FilterBuilder fields={FIELDS} conditions={conditions} onConditionsChange={setConditions} />

      {view === 'kanban' ? (
        <KanbanBoard
          columns={columns}
          cards={cards}
          onCardMove={(cardId, targetColumnId) => updateContact(cardId, { status: targetColumnId })}
          renderCard={(card) => (
            <KanbanCard
              title={card.title}
              subtitle={[card.data.title, card.data.company].filter(Boolean).join(' · ')}
              footer={statusSelect(card.id, card.data.status)}
            />
          )}
        />
      ) : (
        <table className="w-full text-sm border border-gray-200 bg-white">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              {FIELDS.map((field) => (
                <th key={field.key} className="px-3 py-2 font-medium">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.company}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{statusSelect(row.id, row.status)}</td>
                <td className="px-3 py-2 capitalize">{row.interestLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ContactsBoard;
