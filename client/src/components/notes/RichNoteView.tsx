import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { plainTextToDoc, type DocNode } from './serialization';

/** Read-only renderer; falls back to plain text when there is no JSON body. */
export const RichNoteView: React.FC<{ json?: DocNode | null; text?: string | null; className?: string }> = ({
  json,
  text,
  className = '',
}) => {
  const editor = useEditor({
    editable: false,
    extensions: [StarterKit, Mention.configure({ HTMLAttributes: { class: 'mention text-indigo-600 dark:text-indigo-300 font-medium' } })],
    content: json ?? (text ? plainTextToDoc(text) : ''),
    editorProps: { attributes: { class: 'prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100' } },
  });
  React.useEffect(() => {
    editor?.commands.setContent(json ?? (text ? plainTextToDoc(text) : ''));
  }, [json, text, editor]);
  if (!editor) return null;
  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichNoteView;
