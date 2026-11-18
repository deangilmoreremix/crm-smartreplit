import React, { useMemo, useState } from 'react';
import { KanbanBoard, KanbanCard, ViewSwitcher, FilterBuilder } from '../../twenty-integration';
import { useDealStore } from '../../store/dealStore';
import { applyFilters, type FilterCondition } from './applyFilters';

type BoardView = 'table' | 'kanban' | 'calendar';

const FIELDS = [
  { key: 'title', label: 'Title', type: 'TEXT' },
  { key: 'stageName', label: 'Stage', type: 'SELECT' },
  { key: 'value', label: 'Value', type: 'CURRENCY' },
  { key: 'probability', label: 'Probability', type: 'NUMBER' },
  { key: 'priority', label: 'Priority', type: 'SELECT' },
];

/** Twenty-style board for deals: filters + table/kanban views over the local deal store. */
const DealsBoard: React.FC = () => {
  const { deals, pipelines, activePipelineId, moveDeal } = useDealStore();
  const stages = pipelines[activePipelineId]?.stages ?? [];
  const [view, setView] = useState<BoardView>('kanban');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const rows = useMemo(
    () =>
      applyFilters(
        deals.map((deal) => ({ ...deal, stageId: deal.stage?.id, stageName: deal.stage?.name })),
        conditions
      ),
    [deals, conditions]
  );

  const columns = stages.map((stage) => {
    const inStage = rows.filter((row) => row.stageId === stage.id);
    return {
      id: stage.id,
      title: stage.name,
      value: stage.id,
      count: inStage.length,
      aggregation: { field: 'value', type: 'sum' as const, value: inStage.reduce((sum, d) => sum + (d.value || 0), 0) },
    };
  });

  const cards = rows.map((row, index) => ({
    id: row.id,
    title: row.title,
    data: { ...row, stage: row.stageId },
    position: index,
  }));

  const stageSelect = (dealId: string, stageId?: string) => (
    <select
      aria-label="Move to stage"
      value={stageId}
      onChange={(e) => moveDeal(dealId, e.target.value)}
      className="w-full h-8 rounded border border-gray-300 px-2 text-xs"
    >
      {stages.map((stage) => (
        <option key={stage.id} value={stage.id}>
          {stage.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Deals board</h2>
        <ViewSwitcher value={view} onChange={setView} />
      </div>
      <FilterBuilder fields={FIELDS} conditions={conditions} onConditionsChange={setConditions} />

      {view === 'kanban' ? (
        <KanbanBoard
          columns={columns}
          cards={cards}
          onCardMove={(cardId, targetColumnId) => moveDeal(cardId, targetColumnId)}
          renderCard={(card) => (
            <KanbanCard
              title={card.title}
              subtitle={`$${Number(card.data.value || 0).toLocaleString()} · ${card.data.probability ?? 0}%`}
              footer={stageSelect(card.id, card.data.stageId)}
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
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{stageSelect(row.id, row.stageId)}</td>
                <td className="px-3 py-2">${Number(row.value || 0).toLocaleString()}</td>
                <td className="px-3 py-2">{row.probability ?? 0}%</td>
                <td className="px-3 py-2 capitalize">{row.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DealsBoard;
