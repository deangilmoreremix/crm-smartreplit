import React, { useState } from 'react';
import { useSavedViews, applyFilters, applySort } from '../../../../packages/shared/src/views';
import { FilterBuilder, FilterChip, ActiveFilters } from '../Filters/FilterBuilder';
import { ColumnAggregator } from '../DataTable/ColumnAggregator';
import { EnhancedKanban, KanbanColumnData, KanbanCardData } from '../Kanban/EnhancedKanban';
import {
  createEmptyFilterGroup,
  ViewFilter,
  ViewSort,
  ColumnConfig,
  ViewType,
} from '../../../../packages/shared/src/views/saved-views';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../lib/utils';
import { LayoutGrid, List, Calendar, Save, Filter, X } from 'lucide-react';

interface View {
  id: string;
  name: string;
  icon?: string;
}

interface ContactsViewIntegrationProps {
  contacts: Record<string, any>[];
  className?: string;
}

export const ContactsViewIntegration: React.FC<ContactsViewIntegrationProps> = ({
  contacts,
  className,
}) => {
  const { isDark } = useTheme();
  const [activeViewType, setActiveViewType] = useState<ViewType>('table');
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState('');

  const { views, activeView, setActiveView, createView, updateView } = useSavedViews({
    storageKey: 'smartcrm_contacts_views',
  });

  const [localFilters, setLocalFilters] = useState<ViewFilter[]>([]);
  const [localSort, setLocalSort] = useState<ViewSort[]>([]);

  const currentFilters = activeView?.filters || localFilters;
  const currentSort = activeView?.sortOrder || localSort;

  const filteredContacts = applyFilters(contacts, currentFilters);
  const sortedContacts = applySort(filteredContacts, currentSort);

  const columns: ColumnConfig[] = [
    { field: 'name', label: 'Name', sortable: true },
    { field: 'email', label: 'Email', sortable: true },
    { field: 'company', label: 'Company', sortable: true },
    { field: 'status', label: 'Status', sortable: true },
    { field: 'aiScore', label: 'AI Score', sortable: true, aggregation: 'avg' as const },
    { field: 'createdAt', label: 'Created', sortable: true },
  ];

  const availableFields = [
    { field: 'name', label: 'Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'company', label: 'Company', type: 'text' },
    { field: 'status', label: 'Status', type: 'text' },
    { field: 'aiScore', label: 'AI Score', type: 'number' },
    { field: 'industry', label: 'Industry', type: 'text' },
  ];

  const handleFilterChange = (filterGroup: any) => {
    const newFilters: ViewFilter[] = filterGroup.conditions.map((c: any) => ({
      field: c.field,
      operator: c.operator,
      value: c.value,
    }));
    setLocalFilters(newFilters);
    if (activeView) {
      updateView(activeView.id, { filters: newFilters });
    }
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = localFilters.filter((_, i) => i !== index);
    setLocalFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setLocalFilters([]);
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    createView({
      name: viewName,
      viewType: activeViewType,
      filters: localFilters,
      sortOrder: localSort,
      columns,
    });
    setViewName('');
    setShowSaveView(false);
  };

  const viewTypes: { type: ViewType; icon: React.ReactNode; label: string }[] = [
    { type: 'table', icon: <List className="w-4 h-4" />, label: 'Table' },
    { type: 'kanban', icon: <LayoutGrid className="w-4 h-4" />, label: 'Kanban' },
    { type: 'calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
  ];

  const filterGroup = createEmptyFilterGroup();
  filterGroup.conditions = localFilters.map((f) => ({
    field: f.field,
    operator: f.operator as any,
    value: f.value,
  }));

  const kanbanColumns: KanbanColumnData[] = [
    { id: 'new', title: 'New', value: 'new', cards: [] },
    { id: 'contacted', title: 'Contacted', value: 'contacted', cards: [] },
    { id: 'qualified', title: 'Qualified', value: 'qualified', cards: [] },
    { id: 'proposal', title: 'Proposal', value: 'proposal', cards: [] },
    { id: 'closed', title: 'Closed', value: 'closed', cards: [] },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-gray-200 dark:border-gray-800',
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            {viewTypes.map((vt) => (
              <button
                key={vt.type}
                onClick={() => setActiveViewType(vt.type)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  activeViewType === vt.type
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                {vt.icon}
                <span className="hidden sm:inline">{vt.label}</span>
              </button>
            ))}
          </div>

          <select
            value={activeView?.id || ''}
            onChange={(e) => setActiveView(e.target.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm',
              'bg-gray-100 dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-gray-100'
            )}
          >
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterBuilder(!showFilterBuilder)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
              showFilterBuilder
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            )}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <button
            onClick={() => setShowSaveView(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            )}
          >
            <Save className="w-4 h-4" />
            Save View
          </button>
        </div>
      </div>

      {localFilters.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'bg-gray-50 dark:bg-gray-900/50',
            'border-b border-gray-200 dark:border-gray-800'
          )}
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          <div className="flex flex-wrap items-center gap-2">
            {localFilters.map((filter, index) => (
              <FilterChip
                key={index}
                label={filter.field}
                value={String(filter.value)}
                onRemove={() => handleRemoveFilter(index)}
              />
            ))}
            {localFilters.length > 1 && (
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {showFilterBuilder && (
        <div
          className={cn(
            'p-4 border-b border-gray-200 dark:border-gray-800',
            isDark ? 'bg-gray-900' : 'bg-white'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filter Builder</h3>
            <button
              onClick={() => setShowFilterBuilder(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <FilterBuilder
            filters={filterGroup}
            onChange={handleFilterChange}
            availableFields={availableFields}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {activeViewType === 'table' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full">
                <thead
                  className={cn(
                    'sticky top-0',
                    'bg-gray-100 dark:bg-gray-900',
                    'border-b border-gray-200 dark:border-gray-800'
                  )}
                >
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.field}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedContacts.slice(0, 50).map((contact, i) => (
                    <tr
                      key={contact.id || i}
                      className={cn(
                        'border-b border-gray-100 dark:border-gray-800',
                        'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {contact.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contact.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contact.company}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs',
                            contact.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          )}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contact.aiScore}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contact.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ColumnAggregator data={sortedContacts} columns={columns} />
          </div>
        )}

        {activeViewType === 'kanban' && (
          <EnhancedKanban
            columns={kanbanColumns}
            onCardClick={(card, column) => {
              console.log('Card clicked:', card, column);
            }}
            onQuickAction={(action, card, column) => {
              console.log('Quick action:', action, card, column);
            }}
          />
        )}

        {activeViewType === 'calendar' && (
          <div
            className={cn(
              'flex items-center justify-center h-full',
              'text-gray-500 dark:text-gray-400'
            )}
          >
            Calendar view - Coming soon
          </div>
        )}
      </div>

      {showSaveView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={cn(
              'w-96 p-6 rounded-xl',
              'bg-white dark:bg-gray-900',
              'border border-gray-200 dark:border-gray-800',
              'shadow-xl'
            )}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Save View
            </h3>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="View name"
              className={cn(
                'w-full px-3 py-2 rounded-lg mb-4',
                'bg-gray-100 dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-400 dark:placeholder-gray-500'
              )}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveView(false)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm',
                  'text-gray-600 dark:text-gray-400',
                  'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveView}
                className={cn('px-4 py-2 rounded-lg text-sm', 'bg-primary text-white')}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsViewIntegration;
