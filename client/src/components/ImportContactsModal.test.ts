import { describe, it, expect, vi } from 'vitest';
import { parseCSV, autoMapColumns, mapRows, importInBatches } from './ImportContactsModal.utils';

describe('parseCSV', () => {
  it('handles quotes, escaped quotes, embedded newlines and CRLF', () => {
    const rows = parseCSV('a,b\r\n"x, y","say ""hi"""\r\n"multi\nline",z\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['multi\nline', 'z'],
    ]);
  });

  it('strips BOM, detects semicolons and skips blank lines', () => {
    expect(parseCSV('﻿a;b\n\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('autoMapColumns + mapRows', () => {
  const headers = ['First Name', 'Last Name', 'E-mail', 'Job Title', 'Tags', 'Status'];
  it('maps synonyms and builds contacts with per-row errors', () => {
    const mapping = autoMapColumns(headers);
    expect(mapping).toMatchObject({ firstName: 0, lastName: 1, email: 2, position: 3, tags: 4, status: 5 });
    const { contacts, errors } = mapRows(
      [
        ['Ada', 'Lovelace', 'ADA@x.com', 'CTO', 'vip;uk', 'Customer'],
        ['Bob', 'B', 'not-an-email', '', '', ''],
        ['Cy', 'C', 'ada@x.com', '', '', ''],
        ['', '', 'noname@x.com', '', '', 'weird'],
      ],
      mapping
    );
    expect(contacts).toHaveLength(1);
    expect(contacts[0].contact).toMatchObject({
      name: 'Ada Lovelace', email: 'ada@x.com', status: 'customer', tags: ['vip', 'uk'],
    });
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
  });

  it('splits a full name when first/last are absent', () => {
    const { contacts } = mapRows([['Grace Brewster Hopper', 'g@x.com']], { name: 0, email: 1 });
    expect(contacts[0].contact).toMatchObject({ firstName: 'Grace', lastName: 'Brewster Hopper' });
  });
});

describe('importInBatches', () => {
  it('runs in batches of 25, reports progress and collects errors', async () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      row: i + 1,
      contact: { name: `n${i}`, email: `n${i}@x.com`, status: 'lead', tags: [] },
    }));
    let inFlight = 0;
    let maxInFlight = 0;
    const create = vi.fn(async (c: { email: string }) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      if (c.email === 'n7@x.com') throw new Error('boom');
    });
    const progress = vi.fn();
    const summary = await importInBatches(items, create, progress);
    expect(summary.created).toBe(59);
    expect(summary.errors).toEqual([{ row: 8, message: 'boom' }]);
    expect(progress.mock.calls.map((c) => c[0])).toEqual([25, 50, 60]);
    expect(maxInFlight).toBeLessThanOrEqual(25);
  });
});
