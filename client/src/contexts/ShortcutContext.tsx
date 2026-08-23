import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { isMac } from '../hooks/useKeyboardShortcuts';

export interface ShortcutEntry {
  id: string;
  combo: string;
  description: string;
  category?: string;
  handler: () => void;
}

interface ShortcutContextType {
  register: (entry: ShortcutEntry) => void;
  unregister: (id: string) => void;
  shortcuts: ShortcutEntry[];
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

interface ShortcutProviderProps {
  children: ReactNode;
}

export const ShortcutProvider: React.FC<ShortcutProviderProps> = ({ children }) => {
  // Map of id -> entry so re-registration replaces cleanly.
  const registryRef = useRef<Map<string, ShortcutEntry>>(new Map());
  const [version, setVersion] = useState(0);

  const register = useCallback((entry: ShortcutEntry) => {
    registryRef.current.set(entry.id, entry);
    setVersion((v) => v + 1);
  }, []);

  const unregister = useCallback((id: string) => {
    if (registryRef.current.delete(id)) {
      setVersion((v) => v + 1);
    }
  }, []);

  const shortcuts = useMemo(
    () => Array.from(registryRef.current.values()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const value = useMemo<ShortcutContextType>(
    () => ({ register, unregister, shortcuts }),
    [register, unregister, shortcuts]
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
};

export const useShortcuts = (): ShortcutContextType => {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
};

// Turn a combo string into a list of human-readable key tokens for display.
export function formatCombo(combo: string): string[] {
  const modLabel = isMac() ? '⌘' : 'Ctrl';
  return combo
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((segment) =>
      segment
        .split('+')
        .map((t) => t.trim())
        .map((token) => {
          const lower = token.toLowerCase();
          if (lower === 'mod') return modLabel;
          if (lower === 'meta' || lower === 'cmd' || lower === 'command') return '⌘';
          if (lower === 'ctrl' || lower === 'control') return 'Ctrl';
          if (lower === 'shift') return '⇧';
          if (lower === 'alt' || lower === 'option' || lower === 'opt') return '⌥';
          if (lower === 'enter' || lower === 'return') return 'Enter';
          if (lower === 'escape' || lower === 'esc') return 'Esc';
          if (lower === 'space' || lower === 'spacebar') return 'Space';
          return token.toUpperCase();
        })
    )
    .map((parts) => parts.join('+'))
    .flat();
}
