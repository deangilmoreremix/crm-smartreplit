import { cellText } from './tableUtils';
import type { RecordColumn } from './types';

/** Above this many rows exports run in chunks (no background job kind exists for exports). */
export const LARGE_EXPORT_THRESHOLD = 5000;
const CHUNK = 5000;

export function toMatrix<T>(rows: T[], columns: RecordColumn<T>[]): string[][] {
  return [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => cellText(c.accessor(r))))];
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** CSV text split into row chunks (header in the first chunk), formula-injection safe. */
export async function csvChunks(matrix: string[][], chunkSize = CHUNK): Promise<string[]> {
  const Papa = (await import('papaparse')).default;
  const chunks: string[] = [];
  for (let i = 0; i < matrix.length; i += chunkSize) {
    chunks.push(Papa.unparse(matrix.slice(i, i + chunkSize), { escapeFormulae: true }));
  }
  return chunks;
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportCsv<T>(rows: T[], columns: RecordColumn<T>[], name: string) {
  const parts = await csvChunks(toMatrix(rows, columns));
  await tick();
  download(new Blob([parts.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${name}.csv`);
}

export async function exportXlsx<T>(rows: T[], columns: RecordColumn<T>[], name: string) {
  const XLSX = await import('xlsx');
  const matrix = toMatrix(rows, columns);
  const ws = XLSX.utils.aoa_to_sheet([matrix[0]]);
  for (let i = 1; i < matrix.length; i += CHUNK) {
    XLSX.utils.sheet_add_aoa(ws, matrix.slice(i, i + CHUNK), { origin: -1 });
    await tick();
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, `${name}.xlsx`);
}
