import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, subDays, startOfQuarter, startOfYear, startOfMonth } from 'date-fns';
import type { DateRange, DateRangePreset } from '@smartcrm/shared/dashboard';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets: {
  label: string;
  value: DateRangePreset;
  getDates: () => { start: Date; end: Date };
}[] = [
  { label: 'Today', value: 'today', getDates: () => ({ start: new Date(), end: new Date() }) },
  {
    label: 'Last 7 days',
    value: '7d',
    getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: 'Last 90 days',
    value: '90d',
    getDates: () => ({ start: subDays(new Date(), 90), end: new Date() }),
  },
  {
    label: 'This month',
    value: 'this-month',
    getDates: () => ({ start: startOfMonth(new Date()), end: new Date() }),
  },
  {
    label: 'This quarter',
    value: 'this-quarter',
    getDates: () => ({ start: startOfQuarter(new Date()), end: new Date() }),
  },
  {
    label: 'This year',
    value: 'this-year',
    getDates: () => ({ start: startOfYear(new Date()), end: new Date() }),
  },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    const { start, end } = preset.getDates();
    onChange({
      preset: preset.value,
      startDate: start,
      endDate: end,
      label: preset.label,
    });
    setIsOpen(false);
  };

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date }) => {
    setCustomRange({ from: range.from, to: range.to });
  };

  const applyCustomRange = () => {
    if (customRange.from && customRange.to) {
      onChange({
        preset: 'custom',
        startDate: customRange.from,
        endDate: customRange.to,
        label: `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`,
      });
      setIsOpen(false);
    }
  };

  const clearCustomRange = () => {
    setCustomRange({ from: undefined, to: undefined });
  };

  const formatDisplayValue = (range: DateRange) => {
    if (range.label) return range.label;
    return `${format(new Date(range.startDate), 'MMM d')} - ${format(new Date(range.endDate), 'MMM d, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('flex items-center gap-2 text-sm font-normal', className)}
        >
          <CalendarIcon className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-700 dark:text-zinc-300">{formatDisplayValue(value)}</span>
          <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-zinc-200 dark:border-zinc-700 p-2 min-w-[140px]">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase px-2 py-1 mb-1">
              Presets
            </div>
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  value.preset === preset.value &&
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="p-3">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase px-2 py-1 mb-2">
              Custom Range
            </div>
            <Calendar
              mode="range"
              selected={{ from: customRange.from, to: customRange.to }}
              onSelect={handleCustomRangeSelect}
            />
            {customRange.from && customRange.to && (
              <div className="flex items-center justify-between mt-3 px-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {format(customRange.from, 'MMM d')} - {format(customRange.to, 'MMM d')}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={clearCustomRange}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={applyCustomRange}>
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
