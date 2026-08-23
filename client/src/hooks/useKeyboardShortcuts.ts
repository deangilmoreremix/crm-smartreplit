import { useEffect, useRef } from 'react';

export type ShortcutCombo = string;

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutMap {
  [combo: ShortcutCombo]: ShortcutHandler;
}

// Detect the platform modifier (Cmd on macOS, Ctrl elsewhere).
export const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const MOD_KEY = isMac() ? 'meta' : 'ctrl';

interface ParsedKey {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

// Normalize a single key token to a comparable form.
// Accepts "mod", "shift", "alt", "meta", "ctrl", or a literal key (lowercased
// unless it is a single uppercase letter, which preserves shift intent elsewhere).
function normalizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower === 'mod') return MOD_KEY;
  if (lower === 'cmd' || lower === 'command') return 'meta';
  if (lower === 'ctrl' || lower === 'control') return 'ctrl';
  if (lower === 'option' || lower === 'opt') return 'alt';
  if (lower === 'win' || lower === 'windows') return 'meta';
  return token.toLowerCase();
}

// Parse a single combo segment like "mod+shift+k" or "?" or "g".
function parseSegment(segment: string): ParsedKey {
  const tokens = segment.split('+').map((t) => t.trim()).filter(Boolean);
  let mod = false;
  let shift = false;
  let alt = false;
  let key = '';

  for (const raw of tokens) {
    const token = normalizeToken(raw);
    if (token === 'mod') {
      mod = true;
    } else if (token === 'meta' || token === 'ctrl') {
      mod = true;
    } else if (token === 'shift') {
      shift = true;
    } else if (token === 'alt') {
      alt = true;
    } else {
      key = token;
    }
  }

  // Map some common display names to KeyboardEvent.key values.
  if (key === 'esc' || key === 'escape') key = 'escape';
  if (key === 'space' || key === 'spacebar') key = ' ';
  if (key === 'plus') key = '+';
  if (key === 'slash') key = '/';
  if (key === 'arrowup') key = 'arrowup';
  if (key === 'arrowdown') key = 'arrowdown';
  if (key === 'arrowleft') key = 'arrowleft';
  if (key === 'arrowright') key = 'arrowright';
  if (key === 'enter' || key === 'return') key = 'enter';

  return { key, mod, shift, alt };
}

// Convert a combo string ("g+h" or "mod+k") into parsed segments.
function parseCombo(combo: ShortcutCombo): ParsedKey[] {
  return combo
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseSegment);
}

// Match a keyboard event against a parsed segment.
function matchSegment(event: KeyboardEvent, segment: ParsedKey): boolean {
  const eventMod = event.metaKey || event.ctrlKey;
  if (eventMod !== segment.mod) return false;
  if (event.altKey !== segment.alt) return false;

  // For the literal key, derive the "pressed" key. We treat shift as required
  // only when the combo explicitly includes "shift". For letter keys typed
  // with shift elsewhere, rely on event.key directly.
  const eventKey = event.key.toLowerCase();
  let keyMatches: boolean;

  if (segment.key === '') {
    keyMatches = true;
  } else if (segment.key === '?') {
    // "?" is typically Shift + "/" on most layouts.
    keyMatches = eventKey === '?' || eventKey === '/';
  } else if (segment.key.length === 1) {
    keyMatches = eventKey === segment.key;
  } else {
    keyMatches = eventKey === segment.key;
  }

  if (!keyMatches) return false;

  // Shift matching: require shift only if explicitly declared. When not
  // declared, allow either state EXCEPT when the produced key is a shifted
  // symbol (e.g. "?"), to avoid double-triggering on letter combos.
  const isShiftedSymbol = segment.key.length > 1 ? false : /[A-Z0-9!@#$%^&*()_+{}|:"<>?]/.test(event.key) && event.key !== event.key.toLowerCase();
  if (segment.shift) {
    return event.shiftKey || isShiftedSymbol;
  }
  // No explicit shift: accept as long as the key matched (shift-tolerant).
  return true;
}

// True when focus is in a field where typing should not be intercepted.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

const SEQUENCE_TIMEOUT = 800;

/**
 * Global keyboard shortcuts hook.
 *
 * @example
 * useKeyboardShortcuts({
 *   'g+h': () => goHome(),
 *   'mod+k': () => openCommandMenu(),
 *   '?': () => showHelp(),
 * });
 *
 * - Supports `mod` (Cmd on macOS / Ctrl on Windows), `shift`, `alt`.
 * - Supports key sequences ("g then h") separated by whitespace.
 * - Ignores events while typing in inputs/textareas/contenteditable.
 * - Returns nothing; cleanup is handled internally on unmount / map change.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  // Keep the latest shortcuts in a ref so the listener never goes stale and we
  // can avoid re-subscribing on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Track in-progress sequences: combo prefix -> timestamp.
  const sequenceRef = useRef<{ combo: string; time: number } | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Don't hijack typing.
      if (isEditableTarget(event.target)) return;

      const map = shortcutsRef.current;
      const now = Date.now();
      const pending = sequenceRef.current;
      const sequenceExpired =
        pending && now - pending.time > SEQUENCE_TIMEOUT ? true : false;
      if (sequenceExpired) sequenceRef.current = null;

      // Build candidate entries (combo -> parsed segments).
      const entries = Object.entries(map).map(([combo, fn]) => ({
        combo,
        fn,
        segments: parseCombo(combo),
      }));

      const activeSequence = sequenceRef.current;

      for (const { combo, fn, segments } of entries) {
        // Single-key or multi-key sequence.
        if (segments.length === 1) {
          // If a sequence is pending, a single-key shortcut should wait; skip.
          if (activeSequence) continue;
          if (matchSegment(event, segments[0])) {
            event.preventDefault();
            fn(event);
            return;
          }
        } else {
          // Sequence: first segment must match to start, then subsequent
          // segments continue building the prefix.
          const prefixSegments = segments.slice(0, -1);
          const lastSegment = segments[segments.length - 1];

          if (!activeSequence) {
            // Start a sequence only if the first prefix segment matches the
            // current key event.
            if (prefixSegments.length > 0 && matchSegment(event, prefixSegments[0])) {
              sequenceRef.current = {
                combo: prefixSegments.map((s) => s.key).join('+'),
                time: now,
              };
              event.preventDefault();
              return;
            }
          } else {
            // Continue an in-progress sequence.
            const expectedPrefix = prefixSegments.map((s) => s.key).join('+');
            if (activeSequence.combo === expectedPrefix && matchSegment(event, lastSegment)) {
              sequenceRef.current = null;
              event.preventDefault();
              fn(event);
              return;
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
