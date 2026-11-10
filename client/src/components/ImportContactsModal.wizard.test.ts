import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { sheetsFromCsv, sheetsFromWorkbook, autoMapColumns, mapRows, isWorkbookFile } from './ImportContactsModal.utils';

describe('import file parsing', () => {
  it('reads CSV with papaparse and maps columns', async () => {
    const [sheet] = await sheetsFromCsv('﻿First Name;Last Name;E-mail\nAda;Lovelace;ada@x.com\n\n');
    expect(sheet.rows).toEqual([['First Name', 'Last Name', 'E-mail'], ['Ada', 'Lovelace', 'ada@x.com']]);
    const { contacts, errors } = mapRows(sheet.rows.slice(1), autoMapColumns(sheet.rows[0]));
    expect(errors).toEqual([]);
    expect(contacts[0].contact.name).toBe('Ada Lovelace');
  });

  it('reads every sheet of an XLSX workbook as strings', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Name', 'Email', 'Phone'], ['Bob', 'bob@x.com', 5551234], ['', '', '']]), 'People');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Company', 'Email'], ['Acme', 'a@acme.com']]), 'Other');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const sheets = await sheetsFromWorkbook(buf);
    expect(sheets.map((s) => s.name)).toEqual(['People', 'Other']);
    expect(sheets[0].rows).toEqual([['Name', 'Email', 'Phone'], ['Bob', 'bob@x.com', '5551234']]);
    const { contacts } = mapRows(sheets[1].rows.slice(1), autoMapColumns(sheets[1].rows[0]));
    expect(contacts).toHaveLength(0); // no name column: reported as an error per row, not thrown
  });

  it('detects workbook files by extension', () => {
    expect(isWorkbookFile({ name: 'a.XLSX' })).toBe(true);
    expect(isWorkbookFile({ name: 'a.csv' })).toBe(false);
  });
});
