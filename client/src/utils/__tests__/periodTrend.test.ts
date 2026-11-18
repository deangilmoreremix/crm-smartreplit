import { describe, it, expect } from 'vitest';
import { dealPeriodChanges, formatChange, percentChange, splitPeriods } from '../periodTrend';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2030, 0, 1);
const ago = (d: number) => new Date(now - d * DAY);

describe('periodTrend', () => {
  it('splits into current and previous 30-day windows', () => {
    const items = [ago(1), ago(29), ago(31), ago(59), ago(61)];
    const { current, previous } = splitPeriods(items, (d) => d, 30, now);
    expect(current).toHaveLength(2);
    expect(previous).toHaveLength(2);
  });

  it('returns null change without prior data', () => {
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(5, null)).toBeNull();
    expect(percentChange(15, 10)).toBe(50);
    expect(formatChange(null)).toBeNull();
    expect(formatChange(-3)).toEqual({ text: '-3%', trend: 'down' });
  });

  it('computes deal changes only when both periods have deals', () => {
    const d = (value: number, stage: string, days: number) => ({
      value,
      stage,
      createdAt: ago(days),
      updatedAt: ago(days),
    });
    const changes = dealPeriodChanges(
      [d(100, 'qualification', 1), d(300, 'closed-won', 2), d(100, 'qualification', 40)],
      now
    );
    expect(changes.newDeals).toBe(100);
    expect(changes.avgNewDealSize).toBe(100); // 200 vs 100
    expect(changes.wonDeals).toBeNull(); // no won deal in previous period
  });
});
