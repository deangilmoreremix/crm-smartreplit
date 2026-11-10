import { describe, it, expect } from 'vitest';
import { nextCronRun, isValidCron } from '../engine/cron';

const d = (s: string) => new Date(s);

describe('cron', () => {
  it('every minute advances one minute', () => {
    expect(nextCronRun('* * * * *', d('2026-11-10T10:00:30Z'))!.toISOString()).toBe('2026-11-10T10:01:00.000Z');
  });
  it('is strictly after the reference time', () => {
    expect(nextCronRun('0 9 * * *', d('2026-11-10T09:00:00Z'))!.toISOString()).toBe('2026-11-11T09:00:00.000Z');
  });
  it('steps, lists and ranges', () => {
    expect(nextCronRun('*/15 * * * *', d('2026-11-10T10:16:00Z'))!.toISOString()).toBe('2026-11-10T10:30:00.000Z');
    expect(nextCronRun('0 8,17 * * *', d('2026-11-10T09:00:00Z'))!.toISOString()).toBe('2026-11-10T17:00:00.000Z');
    expect(nextCronRun('30 9 * * 1-5', d('2026-11-13T10:00:00Z'))!.toISOString()).toBe('2026-11-16T09:30:00.000Z'); // Fri -> Mon
  });
  it('month and day-of-month rollover', () => {
    expect(nextCronRun('0 0 1 * *', d('2026-11-10T00:00:00Z'))!.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(nextCronRun('0 0 29 2 *', d('2026-11-10T00:00:00Z'))!.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });
  it('day-of-month OR day-of-week when both restricted; 7 means Sunday', () => {
    expect(nextCronRun('0 0 15 * 0', d('2026-11-10T00:00:00Z'))!.toISOString()).toBe('2026-11-15T00:00:00.000Z'); // Sun 15th
    expect(nextCronRun('0 0 * * 7', d('2026-11-10T00:00:00Z'))!.toISOString()).toBe('2026-11-15T00:00:00.000Z');
  });
  it('aliases', () => {
    expect(nextCronRun('@hourly', d('2026-11-10T10:20:00Z'))!.toISOString()).toBe('2026-11-10T11:00:00.000Z');
  });
  it('validates', () => {
    expect(isValidCron('* * * *')).toBe(false);
    expect(isValidCron('61 * * * *')).toBe(false);
    expect(isValidCron('*/0 * * * *')).toBe(false);
    expect(isValidCron('a b c d e')).toBe(false);
    expect(isValidCron('0 9 * * 1-5')).toBe(true);
  });
});
