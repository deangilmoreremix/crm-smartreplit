import React from 'react';
import { Keyboard, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { useShortcuts, formatCombo } from '../contexts/ShortcutContext';
import { cn } from '../lib/utils';

interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutHelpDialog: React.FC<ShortcutHelpDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { shortcuts } = useShortcuts();

  // Group shortcuts by category (default to "General").
  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, entry) => {
    const category = entry.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(entry);
    return acc;
  }, {});

  const orderedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            <DialogTitle className="text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Navigate the CRM without leaving the keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 max-h-[60vh]">
          {shortcuts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No shortcuts are currently registered.
            </p>
          ) : (
            <div className="space-y-6">
              {orderedCategories.map((category) => (
                <section key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    {category}
                  </h3>
                  <ul className="space-y-1">
                    {grouped[category].map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {entry.description}
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-1">
                          {formatCombo(entry.combo).map((key, idx) => (
                            <kbd
                              key={idx}
                              className={cn(
                                'inline-flex min-w-[1.75rem] items-center justify-center rounded-md border px-2 py-1',
                                'text-xs font-semibold text-gray-700 dark:text-gray-200',
                                'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800',
                                'shadow-sm'
                              )}
                            >
                              {key}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelpDialog;
