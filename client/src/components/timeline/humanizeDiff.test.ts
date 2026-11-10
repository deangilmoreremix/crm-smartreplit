import { describe, it, expect } from 'vitest';
import { humanizeDiff, humanizeField, describeEvent } from './humanizeDiff';

describe('humanizeDiff', () => {
  it('formats updates and hides noise keys', () => {
    const ev = {
      event_type: 'update' as const, object_type: 'deal', summary: null,
      diff: { stage: { old: 'lead', new: 'won' }, notes: { old: null, new: 'hi' }, phone: { old: '1', new: null }, updated_at: { old: 'x', new: 'y' } },
    };
    expect(humanizeDiff(ev)).toEqual(['Stage: "lead" → "won"', 'Notes set to "hi"', 'Phone cleared (was "1")']);
    expect(describeEvent(ev)).toBe('deal updated (3 changes)');
  });
  it('handles insert/note and field names', () => {
    expect(humanizeDiff({ event_type: 'insert', object_type: 'contact', diff: { first_name: 'A' }, summary: null })).toEqual([]);
    expect(humanizeDiff({ event_type: 'note', object_type: 'contact', diff: null, summary: 'Called' })).toEqual(['Called']);
    expect(humanizeField('contact_id')).toBe('Contact ID');
  });
});
