export type ContactFieldKey =
  | 'firstName'
  | 'lastName'
  | 'name'
  | 'email'
  | 'phone'
  | 'company'
  | 'position'
  | 'industry'
  | 'status'
  | 'notes'
  | 'tags';

export const CONTACT_FIELDS: { key: ContactFieldKey; label: string }[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'name', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'position', label: 'Job title' },
  { key: 'industry', label: 'Industry' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
];

/** Maps a contact field to the CSV column index it is read from (absent = not imported). */
export type ColumnMapping = Partial<Record<ContactFieldKey, number>>;

export interface ContactDraft {
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  status: string;
  notes?: string;
  tags: string[];
}

export interface RowError {
  /** 1-based data row number (header excluded). */
  row: number;
  message: string;
}

const STATUSES = ['lead', 'prospect', 'customer', 'churned'];

const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts: [string, number][] = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
};

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, embedded newlines, CRLF, BOM. */
export function parseCSV(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const SYNONYMS: Record<ContactFieldKey, string[]> = {
  firstName: ['firstname', 'first', 'givenname'],
  lastName: ['lastname', 'last', 'surname', 'familyname'],
  name: ['name', 'fullname', 'contactname'],
  email: ['email', 'emailaddress', 'mail'],
  phone: ['phone', 'phonenumber', 'mobile', 'tel', 'telephone'],
  company: ['company', 'companyname', 'organization', 'organisation', 'employer'],
  position: ['position', 'title', 'jobtitle', 'role'],
  industry: ['industry', 'sector'],
  status: ['status', 'stage', 'leadstatus'],
  notes: ['notes', 'note', 'comments', 'description'],
  tags: ['tags', 'tag', 'labels'],
};

/** Guess a mapping from header names; each column is used at most once. */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<number>();
  for (const { key } of CONTACT_FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && SYNONYMS[key].includes(normalize(h)));
    if (idx >= 0) {
      mapping[key] = idx;
      used.add(idx);
    }
  }
  return mapping;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Converts data rows (header excluded) into contact drafts using the mapping; invalid rows are reported. */
export function mapRows(
  rows: string[][],
  mapping: ColumnMapping
): { contacts: { row: number; contact: ContactDraft }[]; errors: RowError[] } {
  const contacts: { row: number; contact: ContactDraft }[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  rows.forEach((cells, i) => {
    const row = i + 1;
    const get = (key: ContactFieldKey): string => {
      const idx = mapping[key];
      return idx === undefined ? '' : (cells[idx] ?? '').trim();
    };

    const email = get('email').toLowerCase();
    if (!email) return void errors.push({ row, message: 'Missing email' });
    if (!EMAIL_RE.test(email)) return void errors.push({ row, message: `Invalid email "${email}"` });
    if (seen.has(email)) return void errors.push({ row, message: `Duplicate email "${email}" in file` });

    let firstName = get('firstName');
    let lastName = get('lastName');
    let name = get('name');
    if (!name) name = `${firstName} ${lastName}`.trim();
    if (!name) return void errors.push({ row, message: 'Missing name' });
    if (!firstName && !lastName) {
      const [first, ...rest] = name.split(/\s+/);
      firstName = first;
      lastName = rest.join(' ');
    }

    const rawStatus = get('status').toLowerCase();
    seen.add(email);
    contacts.push({
      row,
      contact: {
        firstName,
        lastName,
        name,
        email,
        phone: get('phone') || undefined,
        company: get('company') || undefined,
        position: get('position') || undefined,
        industry: get('industry') || undefined,
        status: STATUSES.includes(rawStatus) ? rawStatus : 'lead',
        notes: get('notes') || undefined,
        tags: get('tags')
          .split(/[;|,]/)
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
  });

  return { contacts, errors };
}

export interface ImportSummary {
  created: number;
  errors: RowError[];
}

/** Creates contacts in sequential batches (default 25, parallel within a batch), collecting per-row errors. */
export async function importInBatches(
  items: { row: number; contact: ContactDraft }[],
  create: (contact: ContactDraft) => Promise<unknown>,
  onProgress?: (done: number, total: number) => void,
  batchSize = 25
): Promise<ImportSummary> {
  const errors: RowError[] = [];
  let created = 0;
  let done = 0;
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    const results = await Promise.allSettled(batch.map((item) => create(item.contact)));
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        created++;
      } else {
        const reason = result.reason;
        errors.push({
          row: batch[idx].row,
          message: reason instanceof Error ? reason.message : String(reason),
        });
      }
    });
    done += batch.length;
    onProgress?.(done, items.length);
  }
  return { created, errors };
}
