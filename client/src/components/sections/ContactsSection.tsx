import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactStore } from '../../store/contactStore';
import { isDemoId } from '../../data/demoData';
import SampleBadge from '../SampleBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Contact } from '../../types/contact';

const MAX_ROWS = 8;

const isSample = (c: Contact) => Boolean(c.isDemo) || isDemoId(c.id);

/** First `limit` contacts, real ones before sample ones. */
export function selectDashboardContacts(contacts: Record<string, Contact>, limit = MAX_ROWS): Contact[] {
  const all = Object.values(contacts);
  return [...all.filter((c) => !isSample(c)), ...all.filter(isSample)].slice(0, limit);
}

/** Dashboard "Contacts & Leads" widget backed by the contact store. */
const ContactsSection: React.FC = () => {
  const navigate = useNavigate();
  const { contacts, isLoading, error, fetchContacts } = useContactStore();
  const rows = selectDashboardContacts(contacts);
  const total = Object.keys(contacts).length;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm" data-testid="contacts-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts & Leads</h3>
        <button
          type="button"
          onClick={() => navigate('/contacts')}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View all{total > rows.length ? ` (${total})` : ''}
        </button>
      </div>

      {isLoading && rows.length === 0 ? (
        <LoadingSpinner message="Loading contacts..." size="md" />
      ) : error && rows.length === 0 ? (
        <div role="alert" className="text-sm text-red-600 dark:text-red-400">
          <p>Could not load contacts: {error}</p>
          <button
            type="button"
            onClick={() => void fetchContacts()}
            className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No contacts yet. Add your first contact to see it here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((c) => {
            const sample = isSample(c);
            const score = c.score ?? c.aiScore;
            const body = (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {c.name || c.email || 'Unnamed contact'}
                    {sample && <SampleBadge className="ml-2 align-middle" />}
                  </p>
                  {c.company && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{c.company}</p>
                  )}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {c.status}
                </span>
                {typeof score === 'number' && (
                  <span className="w-10 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                    {score}
                  </span>
                )}
              </>
            );
            return (
              <li key={c.id}>
                {sample ? (
                  <div className="flex items-center gap-3 py-2">{body}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contacts/${c.id}`)}
                    className="flex w-full items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ContactsSection;
