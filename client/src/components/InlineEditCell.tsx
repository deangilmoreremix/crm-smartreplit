import React, { useEffect, useRef, useState } from 'react';

interface InlineEditCellProps {
  value: string | number | null | undefined;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  /** Persists the new value; a rejection keeps edit mode open and shows the error. */
  onSave: (value: string | number) => void | Promise<void>;
  /** Read-only rendering; defaults to the value (or the placeholder). */
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  /** Called after Tab saved the edit; lets a table move to the next cell (Shift+Tab passes true). */
  onTab?: (shift: boolean) => void;
}

const InlineEditCell: React.FC<InlineEditCellProps> = ({
  value,
  type = 'text',
  options = [],
  onSave,
  children,
  placeholder = 'N/A',
  className = '',
  onTab,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const start = () => {
    setDraft(value === null || value === undefined ? '' : String(value));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const commit = async (): Promise<boolean> => {
    if (savingRef.current) return false;
    const current = value === null || value === undefined ? '' : String(value);
    if (draft === current) {
      cancel();
      return true;
    }
    const next: string | number = type === 'number' ? Number(draft) : draft;
    if (type === 'number' && (draft.trim() === '' || Number.isNaN(next))) {
      setError('Enter a number');
      return false;
    }
    savingRef.current = true;
    try {
      await onSave(next);
      setEditing(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
      return false;
    } finally {
      savingRef.current = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Tab' && onTab) {
      e.preventDefault();
      const shift = e.shiftKey;
      void commit().then((ok) => ok && onTab(shift));
    }
  };

  if (!editing) {
    return (
      <span
        role="button"
        tabIndex={0}
        title="Click to edit"
        onClick={start}
        onKeyDown={(e) => {
          if (e.key === 'Enter') start();
        }}
        className={`cursor-text hover:bg-gray-100 rounded px-1 ${className}`}
      >
        {children ?? (value === null || value === undefined || value === '' ? placeholder : String(value))}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col">
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={cancel}
          className="border rounded px-1 py-0.5 text-sm"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={cancel}
          className="border rounded px-1 py-0.5 text-sm w-full"
        />
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
};

export default InlineEditCell;
