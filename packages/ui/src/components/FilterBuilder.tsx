import React from 'react';
import { cn } from '../utils/cn';

interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

interface FilterBuilderProps {
  fields: Array<{ key: string; label: string; type: string }>;
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
  className?: string;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  fields,
  conditions,
  onConditionsChange,
  className,
}) => {
  const operators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ];

  const addCondition = () => {
    onConditionsChange([...conditions, { field: fields[0]?.key || '', operator: 'eq', value: '' }]);
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onConditionsChange(newConditions);
  };

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            value={condition.field}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className="flex-1 h-9 rounded-md border border-gray-300 px-2 text-sm"
          >
            {fields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, { operator: e.target.value })}
            className="w-40 h-9 rounded-md border border-gray-300 px-2 text-sm"
          >
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {!['isEmpty', 'isNotEmpty'].includes(condition.operator) && (
            <input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              className="flex-1 h-9 rounded-md border border-gray-300 px-2 text-sm"
              placeholder="Value"
            />
          )}

          <button
            onClick={() => removeCondition(index)}
            className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={addCondition}
        className="text-sm text-green-600 hover:text-green-700 font-medium"
      >
        + Add Filter
      </button>
    </div>
  );
};
