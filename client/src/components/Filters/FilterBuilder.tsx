import React, { useState, useCallback } from 'react';
import {
  FilterGroup,
  FilterCondition,
  FilterOperator,
  createEmptyFilterGroup,
  createFilterCondition,
  OPERATOR_LABELS,
} from '../../../../packages/shared/src/views/saved-views';
import { cn } from '../../../lib/utils';
import { X, Plus, ChevronDown, ChevronRight } from 'lucide-react';

interface FilterBuilderProps {
  filters: FilterGroup;
  onChange: (filters: FilterGroup) => void;
  availableFields: Array<{ field: string; label: string; type?: string }>;
  className?: string;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  onChange,
  availableFields,
  className,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([filters.id]));

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const addCondition = useCallback(
    (groupId: string) => {
      const newCondition = createFilterCondition(availableFields[0]?.field || '', 'equals', '');

      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return { ...group, conditions: [...group.conditions, newCondition] };
        }
        return {
          ...group,
          groups: group.groups?.map(updateGroup),
        };
      };

      onChange(updateGroup(filters));
    },
    [filters, onChange, availableFields]
  );

  const updateCondition = useCallback(
    (groupId: string, index: number, updates: Partial<FilterCondition>) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          const conditions = group.conditions.map((c, i) =>
            i === index ? { ...c, ...updates } : c
          );
          return { ...group, conditions };
        }
        return {
          ...group,
          groups: group.groups?.map((g) => updateGroup(g)),
        };
      };

      onChange(updateGroup(filters));
    },
    [filters, onChange]
  );

  const removeCondition = useCallback(
    (groupId: string, index: number) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return { ...group, conditions: group.conditions.filter((_, i) => i !== index) };
        }
        return {
          ...group,
          groups: group.groups?.map(updateGroup),
        };
      };

      onChange(updateGroup(filters));
    },
    [filters, onChange]
  );

  const addGroup = useCallback(
    (parentGroupId: string, logic: 'and' | 'or') => {
      const newGroup = createEmptyFilterGroup(logic);
      newGroup.conditions = [createFilterCondition(availableFields[0]?.field || '', 'equals', '')];

      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === parentGroupId) {
          return { ...group, groups: [...(group.groups || []), newGroup] };
        }
        return {
          ...group,
          groups: group.groups?.map(updateGroup),
        };
      };

      onChange(updateGroup(filters));
      setExpandedGroups((prev) => new Set([...prev, newGroup.id]));
    },
    [filters, onChange, availableFields]
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        return {
          ...group,
          groups: group.groups?.filter((g) => g.id !== groupId),
        };
      };

      onChange(updateGroup(filters));
    },
    [filters, onChange]
  );

  const setGroupLogic = useCallback(
    (groupId: string, logic: 'and' | 'or') => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return { ...group, logic };
        }
        return {
          ...group,
          groups: group.groups?.map(updateGroup),
        };
      };

      onChange(updateGroup(filters));
    },
    [filters, onChange]
  );

  const renderCondition = (condition: FilterCondition, groupId: string, index: number) => {
    const fieldDef = availableFields.find((f) => f.field === condition.field);

    return (
      <div className="flex items-center gap-2 py-2">
        <select
          value={condition.field}
          onChange={(e) => updateCondition(groupId, index, { field: e.target.value })}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm',
            'bg-gray-100 dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-gray-100'
          )}
        >
          {availableFields.map((field) => (
            <option key={field.field} value={field.field}>
              {field.label}
            </option>
          ))}
        </select>

        <select
          value={condition.operator}
          onChange={(e) =>
            updateCondition(groupId, index, { operator: e.target.value as FilterOperator })
          }
          className={cn(
            'px-3 py-1.5 rounded-md text-sm',
            'bg-gray-100 dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-gray-100'
          )}
        >
          {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
            <option key={op} value={op}>
              {label}
            </option>
          ))}
        </select>

        {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
          <input
            type={fieldDef?.type === 'number' ? 'number' : 'text'}
            value={condition.value}
            onChange={(e) => updateCondition(groupId, index, { value: e.target.value })}
            placeholder="Value"
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-sm',
              'bg-white dark:bg-gray-900',
              'border border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500'
            )}
          />
        )}

        <button
          onClick={() => removeCondition(groupId, index)}
          className={cn(
            'p-1.5 rounded-md',
            'text-gray-400 hover:text-red-500',
            'hover:bg-red-50 dark:hover:bg-red-900/20'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderGroup = (group: FilterGroup, depth: number = 0) => {
    const isExpanded = expandedGroups.has(group.id);
    const indentClass = depth > 0 ? `ml-${Math.min(depth * 8, 32)}` : '';

    return (
      <div key={group.id} className={cn('rounded-lg border p-4', indentClass)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {group.groups && group.groups.length > 0 && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {group.logic === 'and' ? 'Match all' : 'Match any'}
              </span>
              <select
                value={group.logic}
                onChange={(e) => setGroupLogic(group.id, e.target.value as 'and' | 'or')}
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  'bg-gray-100 dark:bg-gray-800',
                  'border border-gray-200 dark:border-gray-700'
                )}
              >
                <option value="and">AND</option>
                <option value="or">OR</option>
              </select>
            </div>
          </div>
          {depth > 0 && (
            <button
              onClick={() => removeGroup(group.id)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Remove group
            </button>
          )}
        </div>

        {group.conditions.map((condition, index) => renderCondition(condition, group.id, index))}

        <button
          onClick={() => addCondition(group.id)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 mt-2 text-sm rounded',
            'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <Plus className="w-4 h-4" />
          Add condition
        </button>

        {isExpanded && group.groups && group.groups.length > 0 && (
          <div className="mt-4 space-y-3">
            {group.groups.map((subGroup) => renderGroup(subGroup, depth + 1))}
          </div>
        )}

        {depth < 2 && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => addGroup(group.id, 'and')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              + Add AND group
            </button>
            <button
              onClick={() => addGroup(group.id, 'or')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              + Add OR group
            </button>
          </div>
        )}
      </div>
    );
  };

  return <div className={cn('space-y-4', className)}>{renderGroup(filters)}</div>;
};

interface FilterChipProps {
  label: string;
  value?: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove, className }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-gray-100 dark:bg-gray-800',
        'text-gray-700 dark:text-gray-300',
        'text-sm',
        className
      )}
    >
      <span className="font-medium">{label}:</span>
      <span>{value || '...'}</span>
      <button onClick={onRemove} className="ml-1 hover:text-red-500">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface ActiveFiltersProps {
  filters: FilterCondition[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  className?: string;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemove,
  onClearAll,
  className,
}) => {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter, index) => (
        <FilterChip
          key={index}
          label={filter.field}
          value={String(filter.value)}
          onRemove={() => onRemove(index)}
        />
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

interface FilterPresetsProps {
  presets: Array<{ id: string; name: string; icon?: string }>;
  activePresetId?: string;
  onSelect: (presetId: string) => void;
  className?: string;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  activePresetId,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400">Presets:</span>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm transition-colors',
            activePresetId === preset.id
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {preset.icon && <span className="mr-1">{preset.icon}</span>}
          {preset.name}
        </button>
      ))}
    </div>
  );
};

export default FilterBuilder;
