import { describe, it, expect } from 'vitest';
import { csvChunks, toMatrix } from './exporters';

const cols = [
  { id: 'n', header: 'Name', accessor: (r: any) => r.n },
  { id: 't', header: 'Tags', accessor: (r: any) => r.t },
];

describe('export', () => {
  it('builds a matrix of visible columns with flattened values', () => {
    expect(toMatrix([{ n: 'Ada', t: ['a', 'b'] }, { n: null, t: undefined }], cols)).toEqual([
      ['Name', 'Tags'],
      ['Ada', 'a; b'],
      ['', ''],
    ]);
  });

  it('chunks CSV, quotes fields and neutralises formulas', async () => {
    const matrix = toMatrix([{ n: 'a,b', t: 1 }, { n: '=SUM(A1)', t: 2 }, { n: 'c', t: 3 }], cols);
    const chunks = await csvChunks(matrix, 2);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain('"a,b"');
    expect(chunks[1]).toContain("'=SUM(A1)");
  });
});
