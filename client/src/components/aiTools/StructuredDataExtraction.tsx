import React, { useState } from 'react';
import { FileJson, Upload, Plus, X, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { generateAI, fileToDataUrl } from '../../services/aiGenerate';

type FieldType = 'string' | 'number' | 'boolean' | 'list';

interface FieldSpec {
  name: string;
  type: FieldType;
}

const typeSchema = (type: FieldType) =>
  type === 'list'
    ? { type: 'array', items: { type: 'string' } }
    : { type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : 'string' };

/** Strict JSON Schema: a list of records, each with exactly the requested fields (null when not found). */
export const buildExtractionSchema = (fields: FieldSpec[]) => {
  const properties: Record<string, unknown> = {};
  for (const f of fields) {
    properties[f.name] = { anyOf: [typeSchema(f.type), { type: 'null' }] };
  }
  return {
    type: 'object',
    additionalProperties: false,
    required: ['records'],
    properties: {
      records: {
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: fields.map((f) => f.name), properties },
      },
    },
  };
};

const cleanName = (name: string) => name.trim().replace(/[^A-Za-z0-9_]/g, '_');

/**
 * Structured Data Extraction: pull the fields you define out of pasted text or an uploaded file
 * (PDF, image or text) using OpenAI Structured Outputs on the user's own key.
 */
const StructuredDataExtraction: React.FC = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FieldSpec[]>([
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'company', type: 'string' },
  ]);
  const [records, setRecords] = useState<Record<string, unknown>[] | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validFields = fields.filter((f) => cleanName(f.name));

  const updateField = (index: number, change: Partial<FieldSpec>) =>
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...change } : f)));

  const extract = async () => {
    if (!text.trim() && !file) {
      setError('Paste some text or upload a file first.');
      return;
    }
    if (validFields.length === 0) {
      setError('Add at least one field to extract.');
      return;
    }
    setIsExtracting(true);
    setError(null);
    setRecords(null);
    try {
      const specs = validFields.map((f) => ({ ...f, name: cleanName(f.name) }));
      let images: string[] | undefined;
      let files: { filename: string; data: string }[] | undefined;
      if (file) {
        const dataUrl = await fileToDataUrl(file);
        if (file.type.startsWith('image/')) images = [dataUrl];
        else files = [{ filename: file.name, data: dataUrl }];
      }
      const { data } = await generateAI({
        prompt: `Extract every record with these fields: ${specs.map((f) => `${f.name} (${f.type})`).join(', ')}. Use null for a field that is not present. Do not invent values.${
          text.trim() ? `\n\nText:\n${text}` : '\n\nUse the attached file.'
        }`,
        schema: buildExtractionSchema(specs),
        schemaName: 'extraction',
        images,
        files,
        maxTokens: 4000,
      });
      if (!data || !Array.isArray(data.records)) throw new Error('The AI returned no records');
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const json = records ? JSON.stringify(records, null, 2) : '';
  const columns = validFields.map((f) => cleanName(f.name));

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Paste text (emails, notes, lists, documents)…"
        className="w-full border border-gray-300 rounded-md p-3 text-sm"
      />

      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center px-3 py-1.5 rounded-md border border-gray-300 cursor-pointer">
          <Upload size={14} className="mr-2" /> {file ? 'Change file' : 'Upload file'}
          <input
            type="file"
            accept=".pdf,.txt,.csv,.md,image/*"
            className="hidden"
            aria-label="Upload file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {file && (
          <span className="flex items-center text-gray-700">
            {file.name}
            <button onClick={() => setFile(null)} className="ml-1 text-gray-500" aria-label="Remove file">
              <X size={14} />
            </button>
          </span>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-800 mb-2">Fields to extract</h4>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={f.name}
                onChange={(e) => updateField(i, { name: e.target.value })}
                placeholder="Field name"
                aria-label={`Field ${i + 1} name`}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
              <select
                value={f.type}
                onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                aria-label={`Field ${i + 1} type`}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="string">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Yes/No</option>
                <option value="list">List</option>
              </select>
              <button
                onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}
                className="text-gray-500"
                aria-label={`Remove field ${i + 1}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setFields((prev) => [...prev, { name: '', type: 'string' }])}
          className="mt-2 flex items-center text-sm text-blue-600"
        >
          <Plus size={14} className="mr-1" /> Add field
        </button>
      </div>

      <button
        onClick={extract}
        disabled={isExtracting}
        className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
      >
        {isExtracting ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <FileJson size={16} className="mr-2" />}
        {isExtracting ? 'Extracting…' : 'Extract data'}
      </button>

      {error && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {records && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <p className="text-sm text-gray-600">No matching records found.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left font-medium text-gray-700">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2 text-gray-800">
                          {r[c] == null ? '' : Array.isArray(r[c]) ? (r[c] as unknown[]).join(', ') : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="relative">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(json);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="absolute top-2 right-2 flex items-center text-xs text-gray-600"
            >
              {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs overflow-x-auto">{json}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredDataExtraction;
