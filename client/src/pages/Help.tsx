import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useShortcuts, formatCombo } from '../contexts/ShortcutContext';
import { APP_ROUTES } from '../utils/appLinks';

const SUPPORT_EMAIL = (import.meta.env as Record<string, string | undefined>).VITE_SUPPORT_EMAIL?.trim();

const GUIDES: Array<{ label: string; to: string; blurb: string }> = [
  { label: 'Contacts', to: APP_ROUTES.contacts, blurb: 'Add, import and search your contacts.' },
  { label: 'Pipeline', to: APP_ROUTES.pipeline, blurb: 'Track deals through your stages.' },
  { label: 'Tasks', to: APP_ROUTES.tasks, blurb: 'Plan follow-ups and to-dos.' },
  { label: 'Calendar', to: APP_ROUTES.calendar, blurb: 'Schedule and review appointments.' },
  { label: 'AI Tools', to: APP_ROUTES.aiTools, blurb: 'Draft, analyze and automate with AI.' },
  { label: 'Settings', to: APP_ROUTES.settings, blurb: 'Team, roles, data model, API keys and webhooks.' },
];

const Help: React.FC = () => {
  const { isDark } = useTheme();
  const { shortcuts } = useShortcuts();
  const card = `rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const muted = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen pt-24 px-6 pb-12 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold mb-1">Help</h1>
          <p className={muted}>Find your way around the app.</p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-3">Where to start</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <Link key={g.to} to={g.to} className={`${card} block hover:border-indigo-500`}>
                <div className="font-medium">{g.label}</div>
                <div className={`text-sm ${muted}`}>{g.blurb}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Keyboard shortcuts</h2>
          <ul className={`${card} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`} data-testid="help-shortcuts">
            <li className="flex items-center justify-between py-2">
              <span className="text-sm">Open the command menu</span>
              <kbd className="px-2 py-1 text-xs rounded border">Ctrl/⌘ K</kbd>
            </li>
            {shortcuts
              .filter((s) => s.category !== 'Lists')
              .map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{s.description}</span>
                  <span className="flex gap-1">
                    {formatCombo(s.combo).map((k, i) => (
                      <kbd key={i} className="px-2 py-1 text-xs rounded border">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {SUPPORT_EMAIL && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Need more help?</h2>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-500 hover:underline">
              Contact support
            </a>
          </section>
        )}
      </div>
    </div>
  );
};

export default Help;
