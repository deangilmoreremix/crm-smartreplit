import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';

/** Shown only while sample data is hidden; one click brings it back. */
const RestoreSampleData: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { showDemoData, restoreDemoData } = useDemoData();
  if (showDemoData) return null;
  return (
    <button
      type="button"
      onClick={restoreDemoData}
      data-testid="button-restore-sample-data"
      className={`inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 ${className}`}
    >
      <RotateCcw size={16} />
      <span>Sample data is hidden — Restore sample data</span>
    </button>
  );
};

export default RestoreSampleData;

/** Settings card: show/hide sample data, plus the restore shortcut while it is hidden. */
export const SampleDataSettingsCard: React.FC = () => {
  const { showDemoData, clearDemoData, restoreDemoData } = useDemoData();
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      data-testid="sample-data-card"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Sample data</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Example deals, contacts, appointments and charts that make an empty CRM easier to
            explore. Your own data is never affected.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showDemoData}
          aria-label="Show sample data"
          data-testid="toggle-sample-data"
          onClick={showDemoData ? clearDemoData : restoreDemoData}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${showDemoData ? 'bg-indigo-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${showDemoData ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
      {!showDemoData && <RestoreSampleData className="mt-4" />}
    </div>
  );
};
