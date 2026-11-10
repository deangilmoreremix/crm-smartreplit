export interface DocNode {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  content?: DocNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

/** What the editor stores: tiptap JSON plus derived plain text (kept in sync for search / legacy `content`). */
export interface NoteValue {
  json: DocNode | null;
  text: string;
}

export const EMPTY_NOTE: NoteValue = { json: null, text: '' };

const BLOCKS = new Set(['paragraph', 'heading', 'listItem', 'codeBlock', 'blockquote', 'horizontalRule']);

export function docToPlainText(doc: DocNode | null | undefined): string {
  if (!doc) return '';
  const out: string[] = [];
  const walk = (n: DocNode) => {
    if (n.type === 'text') {
      out.push(n.text ?? '');
      return;
    }
    if (n.type === 'mention') {
      out.push(`@${n.attrs?.label ?? n.attrs?.id ?? ''}`);
      return;
    }
    if (n.type === 'hardBreak') {
      out.push('\n');
      return;
    }
    (n.content ?? []).forEach(walk);
    if (n.type && BLOCKS.has(n.type)) out.push('\n');
  };
  walk(doc);
  return out.join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function plainTextToDoc(text: string): DocNode {
  const lines = (text ?? '').split(/\r?\n/);
  return {
    type: 'doc',
    content: lines.map((l) => (l ? { type: 'paragraph', content: [{ type: 'text', text: l }] } : { type: 'paragraph' })),
  };
}

export function toNoteValue(json: DocNode | null): NoteValue {
  return { json, text: docToPlainText(json) };
}

/** Rebuild an editor value from DB columns: prefer body_json, fall back to legacy plain `content`. */
export function fromStored(row: { body_json?: unknown; body_text?: string | null; content?: string | null }): NoteValue {
  const raw = row.body_json;
  let json: DocNode | null = null;
  if (raw && typeof raw === 'object') json = raw as DocNode;
  else if (typeof raw === 'string') {
    try {
      json = JSON.parse(raw) as DocNode;
    } catch {
      json = null;
    }
  }
  if (json) return { json, text: row.body_text ?? docToPlainText(json) };
  const text = row.body_text ?? row.content ?? '';
  return { json: text ? plainTextToDoc(text) : null, text };
}

/** Columns to persist: `content` stays populated so existing readers keep working. */
export function toStored(value: NoteValue) {
  return { content: value.text, body_text: value.text, body_json: value.json };
}

export function extractMentions(doc: DocNode | null | undefined): Array<{ id: string; label: string }> {
  const found: Array<{ id: string; label: string }> = [];
  const walk = (n: DocNode) => {
    if (n.type === 'mention' && n.attrs?.id != null) found.push({ id: String(n.attrs.id), label: String(n.attrs.label ?? '') });
    (n.content ?? []).forEach(walk);
  };
  if (doc) walk(doc);
  return found;
}
