import { describe, it, expect } from 'vitest';
import { openPipelineValue } from '../DashboardHeader';

const deal = (stageId: string, value: number) => ({ stage: { id: stageId }, value }) as any;

describe('openPipelineValue', () => {
  it('excludes closed-won and closed-lost deals', () => {
    expect(
      openPipelineValue([deal('proposal', 100), deal('closed-won', 900), deal('closed-lost', 50), deal('lead', 5)])
    ).toBe(105);
  });
  it('is 0 for no open deals', () => {
    expect(openPipelineValue([deal('closed-won', 10)])).toBe(0);
    expect(openPipelineValue([])).toBe(0);
  });
});
