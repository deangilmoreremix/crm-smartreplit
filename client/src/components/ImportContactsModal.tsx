import React, { useMemo, useState } from 'react';
import {
  CONTACT_FIELDS,
  ColumnMapping,
  ContactDraft,
  ContactFieldKey,
  ImportSummary,
  autoMapColumns,
  importInBatches,
  mapRows,
  ImportSheet,
  readImportFile,
} from './ImportContactsModal.utils';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Creates one contact through the contacts API; must reject on failure. */
  onCreate: (contact: ContactDraft) => Promise<unknown>;
  /** Called once after an import finishes (e.g. to refresh the list). */
  onComplete?: (summary: ImportSummary) => void;
}

type Step = 'upload' | 'sheet' | 'map' | 'preview' | 'done';

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onComplete,
}) => {
  const [sheets, setSheets] = useState<ImportSheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [step, setStep] = useState<Step>('upload');
  const rows = useMemo(() => sheets[sheetIdx]?.rows ?? [], [sheets, sheetIdx]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const headers = rows[0] ?? [];
  const dataRows = useMemo(() => rows.slice(1), [rows]);
  const mapped = useMemo(() => mapRows(dataRows, mapping), [dataRows, mapping]);
  const importing = progress !== null && summary === null;

  if (!isOpen) return null;

  const reset = () => {
    setSheets([]);
    setSheetIdx(0);
    setStep('upload');
    setMapping({});
    setFileError(null);
    setProgress(null);
    setSummary(null);
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const selectSheet = (all: ImportSheet[], idx: number) => {
    setSheetIdx(idx);
    const r = all[idx]?.rows ?? [];
    setMapping(r.length ? autoMapColumns(r[0]) : {});
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setSummary(null);
    setProgress(null);
    try {
      const parsed = (await readImportFile(file)).filter((sh) => sh.rows.length >= 2);
      if (parsed.length === 0) {
        setFileError('The file needs a header row and at least one data row.');
        setSheets([]);
        return;
      }
      setSheets(parsed);
      selectSheet(parsed, 0);
      setStep(parsed.length > 1 ? 'sheet' : 'map');
    } catch {
      setFileError('Could not read the file.');
    }
  };

  const handleImport = async () => {
    setProgress({ done: 0, total: mapped.contacts.length });
    const result = await importInBatches(mapped.contacts, onCreate, (done, total) =>
      setProgress({ done, total })
    );
    // Validation failures are reported alongside creation failures.
    const all = { created: result.created, errors: [...mapped.errors, ...result.errors].sort((a, b) => a.row - b.row) };
    setSummary(all);
    setStep('done');
    onComplete?.(all);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-label="Import contacts">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import contacts</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <ol className="flex gap-3 text-xs text-gray-500" aria-label="Import steps">
          {(['upload', 'sheet', 'map', 'preview', 'done'] as Step[])
            .filter((st) => st !== 'sheet' || sheets.length > 1)
            .map((st, i) => (
              <li key={st} aria-current={st === step ? 'step' : undefined} className={st === step ? 'font-semibold text-blue-600' : ''}>
                {i + 1}. {{ upload: 'Upload', sheet: 'Sheet', map: 'Map columns', preview: 'Review', done: 'Done' }[st]}
              </li>
            ))}
        </ol>

        {step === 'upload' && (
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFile}
            disabled={importing}
            aria-label="CSV or Excel file"
          />
        )}
        {fileError && <div className="text-sm text-red-600">{fileError}</div>}

        {step === 'sheet' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Choose a sheet</h3>
            <select
              aria-label="Sheet"
              value={sheetIdx}
              onChange={(e) => selectSheet(sheets, Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {sheets.map((sh, i) => (
                <option key={sh.name} value={i}>
                  {sh.name} ({sh.rows.length - 1} rows)
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStep('upload')} className="px-3 py-1.5 text-sm border rounded-md">Back</button>
              <button type="button" onClick={() => setStep('map')} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md">Next</button>
            </div>
          </div>
        )}

        {step === 'map' && rows.length > 0 && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-2">Map columns</h3>
              <div className="grid grid-cols-2 gap-2">
                {CONTACT_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {label}
                      {key === 'email' && <span className="text-red-500"> *</span>}
                    </span>
                    <select
                      value={mapping[key] ?? ''}
                      disabled={importing}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMapping((prev) => {
                          const next = { ...prev };
                          if (value === '') delete next[key as ContactFieldKey];
                          else next[key as ContactFieldKey] = Number(value);
                          return next;
                        });
                      }}
                      className="border rounded px-2 py-1 w-48"
                    >
                      <option value="">Do not import</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStep(sheets.length > 1 ? 'sheet' : 'upload')} className="px-3 py-1.5 text-sm border rounded-md">Back</button>
              <button
                type="button"
                onClick={() => setStep('preview')}
                disabled={mapping.email === undefined}
                title={mapping.email === undefined ? 'Map the Email column first' : undefined}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 'preview' && rows.length > 0 && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-2">
                Preview ({mapped.contacts.length} valid, {mapped.errors.length} with problems)
              </h3>
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">Company</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mapped.contacts.slice(0, 5).map(({ row, contact }) => (
                    <tr key={row} className="border-t">
                      <td className="px-2 py-1">{contact.name}</td>
                      <td className="px-2 py-1">{contact.email}</td>
                      <td className="px-2 py-1">{contact.company}</td>
                      <td className="px-2 py-1">{contact.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mapped.errors.length > 0 && (
                <ul className="mt-2 text-xs text-amber-700 max-h-24 overflow-y-auto">
                  {mapped.errors.map((err) => (
                    <li key={err.row}>Row {err.row}: {err.message} (will be skipped)</li>
                  ))}
                </ul>
              )}
            </div>

            {progress && (
              <div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className="bg-blue-600 h-2 rounded"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {progress.done} / {progress.total}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStep('map')} disabled={importing} className="px-3 py-1.5 text-sm border rounded-md">
                Back
              </button>
              <button type="button" onClick={handleClose} disabled={importing} className="px-3 py-1.5 text-sm border rounded-md">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || mapped.contacts.length === 0}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${mapped.contacts.length} contacts`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && summary && (
          <div className="space-y-2">
            <div className="text-sm">
              Imported {summary.created} contact{summary.created === 1 ? '' : 's'}
              {summary.errors.length > 0 && `, ${summary.errors.length} failed or skipped`}.
            </div>
            {summary.errors.length > 0 && (
              <ul className="text-xs text-red-600 max-h-40 overflow-y-auto">
                {summary.errors.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.message}</li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={handleClose} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportContactsModal;
