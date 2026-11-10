import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useDashboardLayout } from '../../contexts/DashboardLayoutContext';

export interface WidgetMetricOption {
  value: string;
  label: string;
}

export const WIDGET_RANGES = [7, 30, 90] as const;

/** Read a section's persisted widget settings with defaults. */
export function useWidgetSettings(sectionId: string) {
  const { widgetSettings, setWidgetSettings } = useDashboardLayout();
  const s = (widgetSettings[sectionId] || {}) as { rangeDays?: number; metric?: string };
  return {
    rangeDays: s.rangeDays ?? 30,
    metric: s.metric as string | undefined,
    setSettings: (patch: { rangeDays?: number; metric?: string }) =>
      setWidgetSettings(sectionId, patch),
  };
}

const LayoutWidgetSettings: React.FC<{ sectionId: string; metrics?: WidgetMetricOption[] }> = ({
  sectionId,
  metrics = [],
}) => {
  const [open, setOpen] = useState(false);
  const { rangeDays, metric, setSettings } = useWidgetSettings(sectionId);

  return (
    <div className="relative flex justify-end mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Widget settings"
        aria-label="Widget settings"
        aria-expanded={open}
        className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-white/10 shadow-sm"
      >
        <SlidersHorizontal size={14} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-56 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-xl space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date range</p>
            <div className="flex gap-1">
              {WIDGET_RANGES.map((d) => (
                <button
                  key={d}
                  onClick={() => setSettings({ rangeDays: d })}
                  className={`flex-1 px-2 py-1 rounded text-xs ${
                    rangeDays === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {metrics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Metric</p>
              <select
                value={metric ?? metrics[0].value}
                onChange={(e) => setSettings({ metric: e.target.value })}
                className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
              >
                {metrics.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LayoutWidgetSettings;
