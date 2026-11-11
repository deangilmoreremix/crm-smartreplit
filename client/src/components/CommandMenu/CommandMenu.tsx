import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalSearch, recordPath } from '../../hooks/useGlobalSearch';
import { useFavorites } from '../../hooks/useFavorites';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  action: () => void;
}

export interface CommandMenuProps {
  items: CommandItem[];
  placeholder?: string;
  /** Search CRM records (contacts, deals, tasks, ...) via global_search. Default true. */
  searchRecords?: boolean;
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  items,
  placeholder = 'Search commands...',
  searchRecords = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { groups: recordGroups, loading: searching } = useGlobalSearch(searchRecords && isOpen ? search : '');

  const recordItems: CommandItem[] = recordGroups.flatMap(group =>
    group.results.map(r => ({
      id: `record-${r.object_type}-${r.record_id}`,
      label: r.title,
      description: r.subtitle ?? undefined,
      category: group.label,
      action: () => navigate(recordPath(r.object_type, r.record_id))
    }))
  );

  const matchedCommands = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );
  // Contextual actions first, then record hits, then the remaining commands.
  const filteredItems = [
    ...matchedCommands.filter(i => i.category === 'Current record'),
    ...recordItems,
    ...matchedCommands.filter(i => i.category !== 'Current record')
  ];

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatItems = filteredItems;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (flatItems.length) setSelectedIndex(prev => (prev + 1) % flatItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (flatItems.length) setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, flatItems, selectedIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleItemClick = (item: CommandItem) => {
    item.action();
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-40"
        title="Command Menu (⌘K)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 pt-20 pb-6 flex justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full py-4 text-lg outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded">
              ESC
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {flatItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {searching ? 'Searching...' : 'No commands found'}
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {category}
                  </div>
                  {categoryItems.map((item) => {
                    const globalIndex = flatItems.indexOf(item);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full px-4 py-3 flex items-center justify-between ${
                          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center">
                          {item.icon && (
                            <span className="mr-3 text-gray-400">{item.icon}</span>
                          )}
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{item.label}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                            )}
                          </div>
                        </div>
                        {item.shortcut && (
                          <kbd className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded mr-1">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded mr-1">↵</kbd>
                Select
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
              to toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Matches /contacts/:id, /deals/:id, ... so the menu can offer actions for the open record. */
export function parseRecordRoute(pathname: string): { objectType: string; recordId: string } | null {
  const m = pathname.match(/^\/(contacts|deals|companies)\/([^/]+)\/?$/);
  if (!m) return null;
  // Static sub-pages that share the /contacts/ prefix are not records.
  if (m[1] === 'contacts' && ['duplicates', 'relationships'].includes(m[2])) return null;
  const type = { contacts: 'contact', deals: 'deal', companies: 'company' }[m[1] as 'contacts' | 'deals' | 'companies'];
  return { objectType: type, recordId: decodeURIComponent(m[2]) };
}

export function buildDefaultItems(navigate: (to: string) => void): CommandItem[] {
const items: CommandItem[] = [
  {
    id: 'contacts',
    label: 'Go to Contacts',
    description: 'Navigate to contacts list',
    category: 'Navigation',
    shortcut: 'G C',
    action: () => navigate('/contacts')
  },
  {
    id: 'deals',
    label: 'Go to Deals',
    description: 'Navigate to deals pipeline',
    category: 'Navigation',
    shortcut: 'G P',
    action: () => navigate('/pipeline')
  },
  {
    id: 'tasks',
    label: 'Go to Tasks',
    description: 'Navigate to tasks list',
    category: 'Navigation',
    shortcut: 'G T',
    action: () => navigate('/tasks')
  },
  {
    id: 'gtm-hub',
    label: 'Go to GTM Prompt Hub',
    description: 'Open GTM analytics dashboard',
    category: 'Navigation',
    action: () => navigate('/gtm-prompt-hub')
  },
  {
    id: 'open-claw',
    label: 'Open Claw Assistant',
    description: 'Open AI assistant panel',
    category: 'Navigation',
    action: () => navigate('/openclaw')
  },
  {
    id: 'create-contact',
    label: 'Create Contact',
    description: 'Add a new contact',
    category: 'Actions',
    action: () => navigate('/contacts?new=1')
  },
  {
    id: 'create-deal',
    label: 'Create Deal',
    description: 'Open the pipeline to add a deal',
    category: 'Actions',
    action: () => navigate('/pipeline')
  },
  {
    id: 'create-task',
    label: 'Create Task',
    description: 'Add a new task',
    category: 'Actions',
    action: () => navigate('/tasks?new=1')
  },
  {
    id: 'search-contacts',
    label: 'Search Contacts',
    description: 'Find contacts by name or email',
    category: 'Search',
    action: () => navigate('/contacts?search=1')
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Application settings',
    category: 'Navigation',
    action: () => navigate('/settings')
  },
  {
    id: 'help',
    label: 'Help & Support',
    description: 'Get help with the application',
    category: 'Navigation',
    action: () => navigate('/help')
  }
];
  return items;
}

// Rendered inside the Router; adds contextual actions on top of the static commands.
const DefaultCommandMenu: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const current = parseRecordRoute(pathname);

  const items = React.useMemo(() => {
    const base = buildDefaultItems(navigate);
    if (!current) return base;
    const fav = isFavorite(current.objectType, current.recordId);
    return [
      {
        id: 'toggle-favorite',
        label: fav ? 'Remove from favorites' : 'Add to favorites',
        description: `Current ${current.objectType}`,
        category: 'Current record',
        action: () => { void toggleFavorite(current.objectType, current.recordId); }
      },
      ...base
    ];
  }, [navigate, current?.objectType, current?.recordId, isFavorite, toggleFavorite]);

  return <CommandMenu items={items} placeholder="Search commands, contacts, deals..." />;
};

export const useCommandMenu = () => {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  return {
    isCommandMenuOpen,
    setIsCommandMenuOpen,
    CommandMenuComponent: DefaultCommandMenu
  };
};

export default CommandMenu;
