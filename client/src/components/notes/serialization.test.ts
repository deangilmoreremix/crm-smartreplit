import { describe, it, expect } from 'vitest';
import { docToPlainText, plainTextToDoc, fromStored, toStored, toNoteValue, extractMentions } from './serialization';

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', content: [{ type: 'text', text: 'Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Hi ' }, { type: 'mention', attrs: { id: '7', label: 'Ann' } }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] },
  ],
};

describe('note serialization', () => {
  it('derives plain text with mentions', () => {
    expect(docToPlainText(doc)).toBe('Title\nHi @Ann\none');
  });
  it('round-trips text -> doc -> text', () => {
    expect(docToPlainText(plainTextToDoc('a\n\nb'))).toBe('a\n\nb');
  });
  it('stores and restores, with legacy fallback', () => {
    const stored = toStored(toNoteValue(doc));
    expect(stored.content).toBe(stored.body_text);
    expect(fromStored(stored).json).toEqual(doc);
    expect(fromStored({ content: 'legacy' })).toEqual({ json: plainTextToDoc('legacy'), text: 'legacy' });
    expect(fromStored({ body_json: JSON.stringify(doc) }).json).toEqual(doc);
    expect(fromStored({ content: '' }).json).toBeNull();
  });
  it('extracts mentions', () => {
    expect(extractMentions(doc)).toEqual([{ id: '7', label: 'Ann' }]);
  });
});
