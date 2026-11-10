import { supabase } from '../../lib/supabase';

export interface MentionItem {
  id: string;
  label: string;
}

export async function fetchMentionItems(query: string): Promise<MentionItem[]> {
  if (!query.trim()) return [];
  try {
    const { data } = await supabase.rpc('global_search', { q: query, lim: 8 });
    return ((data as Array<{ object_type: string; record_id: string; title: string }>) ?? [])
      .filter((r) => r.object_type === 'contact')
      .map((r) => ({ id: r.record_id, label: r.title }));
  } catch {
    return [];
  }
}

/** Dependency-free suggestion popup (plain DOM) for @tiptap/extension-mention. */
export function createMentionSuggestion(fetchItems: (q: string) => Promise<MentionItem[]> = fetchMentionItems) {
  return {
    items: ({ query }: { query: string }) => fetchItems(query),
    render: () => {
      let el: HTMLDivElement | null = null;
      let items: MentionItem[] = [];
      let selected = 0;
      let command: ((i: MentionItem) => void) | null = null;

      const draw = () => {
        if (!el) return;
        el.innerHTML = '';
        if (!items.length) {
          el.style.display = 'none';
          return;
        }
        el.style.display = 'block';
        items.forEach((it, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = it.label;
          b.className =
            'block w-full text-left px-3 py-1.5 text-sm ' +
            (i === selected
              ? 'bg-indigo-50 dark:bg-indigo-900/40 text-gray-900 dark:text-gray-100'
              : 'text-gray-700 dark:text-gray-200');
          b.onmousedown = (ev) => {
            ev.preventDefault();
            command?.(it);
          };
          el!.appendChild(b);
        });
      };
      const place = (rect?: (() => DOMRect | null) | null) => {
        const r = rect?.();
        if (!el || !r) return;
        el.style.left = `${r.left}px`;
        el.style.top = `${r.bottom + 4}px`;
      };

      return {
        onStart: (p: any) => {
          el = document.createElement('div');
          el.className =
            'fixed z-[60] min-w-[10rem] max-h-60 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg';
          document.body.appendChild(el);
          items = p.items;
          command = p.command;
          selected = 0;
          draw();
          place(p.clientRect);
        },
        onUpdate: (p: any) => {
          items = p.items;
          command = p.command;
          selected = 0;
          draw();
          place(p.clientRect);
        },
        onKeyDown: (p: { event: KeyboardEvent }) => {
          if (!items.length) return false;
          if (p.event.key === 'ArrowDown') {
            selected = (selected + 1) % items.length;
            draw();
            return true;
          }
          if (p.event.key === 'ArrowUp') {
            selected = (selected - 1 + items.length) % items.length;
            draw();
            return true;
          }
          if (p.event.key === 'Enter' || p.event.key === 'Tab') {
            command?.(items[selected]);
            return true;
          }
          if (p.event.key === 'Escape') {
            el?.remove();
            el = null;
            return true;
          }
          return false;
        },
        onExit: () => {
          el?.remove();
          el = null;
        },
      };
    },
  };
}
