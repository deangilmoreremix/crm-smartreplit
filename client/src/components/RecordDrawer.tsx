import React, { useEffect } from 'react';

interface RecordDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Shows an "Open full record" link. */
  openHref?: string;
  onOpenFull?: () => void;
  children: React.ReactNode;
}

/** Right-hand side panel for a record preview; Esc closes it. */
const RecordDrawer: React.FC<RecordDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  openHref,
  onOpenFull,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <aside aria-label="Record details" className="w-96 shrink-0 border-l bg-white p-4 overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg truncate">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
          {openHref && (
            <a
              href={openHref}
              onClick={(e) => {
                if (onOpenFull && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  onOpenFull();
                }
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Open full record
            </a>
          )}
        </div>
        <button onClick={onClose} aria-label="Close panel" className="text-gray-500 ml-2">
          x
        </button>
      </div>
      {children}
    </aside>
  );
};

export default RecordDrawer;
