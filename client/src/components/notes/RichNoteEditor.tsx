import React, { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { createMentionSuggestion } from './mentionSuggestion';
import { toNoteValue, type DocNode, type NoteValue } from './serialization';

export interface RichNoteEditorProps {
  value: NoteValue;
  onChange: (value: NoteValue) => void;
  onSubmit?: (value: NoteValue) => void;
  placeholder?: string;
  className?: string;
}

const btn = (active: boolean) =>
  `px-2 py-1 text-xs rounded border ${
    active
      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

const Toolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const items: Array<[string, boolean, () => void, string]> = [
    ['B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold'],
    ['I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic'],
    ['H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading'],
    ['• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list'],
    ['1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list'],
    ['Code', editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Inline code'],
    ['Link', editor.isActive('link'), setLink, 'Link'],
  ];
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 p-1" role="toolbar" aria-label="Formatting">
      {items.map(([label, active, run, title]) => (
        <button key={title} type="button" title={title} aria-pressed={active} className={btn(active)} onClick={run}>
          {label}
        </button>
      ))}
    </div>
  );
};

export const RichNoteEditor: React.FC<RichNoteEditorProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a note... use @ to mention',
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: { class: 'mention text-indigo-600 dark:text-indigo-300 font-medium' },
        suggestion: createMentionSuggestion() as any,
      }),
    ],
    content: value.json ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[6rem] p-3 outline-none text-gray-900 dark:text-gray-100',
      },
      handleKeyDown: (_v, e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
          e.preventDefault();
          // read the latest doc through the editor ref below
          submitRef.current?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(toNoteValue(ed.getJSON() as DocNode)),
  });

  const submitRef = React.useRef<(() => void) | null>(null);
  submitRef.current = () => editor && onSubmit?.(toNoteValue(editor.getJSON() as DocNode));

  // External reset (e.g. cleared after submit)
  useEffect(() => {
    if (!editor) return;
    const current = toNoteValue(editor.getJSON() as DocNode).text;
    if (value.text !== current) editor.commands.setContent(value.json ?? '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;
  return (
    <div className={`rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {onSubmit && (
        <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 p-2">
          <button
            type="button"
            onClick={() => submitRef.current?.()}
            disabled={!value.text.trim()}
            className="px-3 py-1 text-sm rounded bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700"
          >
            Save note
          </button>
        </div>
      )}
    </div>
  );
};

export default RichNoteEditor;
