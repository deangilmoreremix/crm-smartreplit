import { describe, it, expect } from 'vitest';
import { sliceForRange } from '../ChartsSection';

describe('sliceForRange', () => {
  const series = [1, 2, 3, 4, 5, 6];
  it('narrows the series for shorter ranges', () => {
    expect(sliceForRange(series, 7)).toEqual([5, 6]);
    expect(sliceForRange(series, 30)).toEqual([4, 5, 6]);
    expect(sliceForRange(series, 90)).toEqual(series);
  });
});
