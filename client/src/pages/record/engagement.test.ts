import { describe, it, expect } from 'vitest';
import { computeEngagement } from './engagement';

describe('computeEngagement', () => {
  it('derives counts and task completion from real data only', () => {
    const s = computeEngagement({
      activities: 4,
      notes: 2,
      tasks: [{ status: 'completed' }, { status: 'pending' }, { status: 'completed' }, { status: 'pending' }],
      deals: [{ stage: 'proposal' }, { stage: 'closed-won' }, { status: 'lost' }],
    });
    expect(s.taskCompletionPct).toBe(50);
    expect(s.tasksTotal).toBe(4);
    expect(s.deals).toBe(3);
    expect(s.openDeals).toBe(1);
    expect(s.totalTouchpoints).toBe(4 + 2 + 4 + 3);
  });
  it('has no percentage without tasks and tolerates unreadable sources', () => {
    const s = computeEngagement({ activities: null, notes: 0, tasks: [], deals: null });
    expect(s.taskCompletionPct).toBeNull();
    expect(s.deals).toBeNull();
    expect(s.activities).toBeNull();
    expect(s.totalTouchpoints).toBe(0);
  });
});
