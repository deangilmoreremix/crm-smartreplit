import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import type { RowMenuItem } from './types';

interface RowContextMenuProps {
  items: RowMenuItem[];
  /** The element that opens the menu on right-click (rendered as-is via asChild). */
  children: React.ReactElement;
}

/** Right-click menu around a row/card (Radix: portal, keyboard navigation, Esc to close). */
const RowContextMenu: React.FC<RowContextMenuProps> = ({ items, children }) => {
  if (items.length === 0) return children;
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="z-50 min-w-[11rem] rounded-md border bg-white p-1 text-sm shadow-lg"
          aria-label="Row actions"
        >
          {items.map((item, i) => (
            <React.Fragment key={`${item.label}-${i}`}>
              {item.separatorBefore && i > 0 && <ContextMenu.Separator className="my-1 h-px bg-gray-200" />}
              <ContextMenu.Item
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={`cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-40 ${
                  item.destructive ? 'text-red-600' : ''
                }`}
              >
                {item.label}
              </ContextMenu.Item>
            </React.Fragment>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default RowContextMenu;
