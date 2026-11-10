import { supabase } from '../../lib/supabase';
import { createRestAdapter } from './bulkAdapter';
import type { SelectOption } from './types';

export interface ContactRow {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  industry?: string | null;
  status?: string | null;
  tags?: string[] | null;
  createdAt?: string | null;
}

export const CONTACT_STATUS_OPTIONS: SelectOption[] = ['lead', 'prospect', 'active', 'customer', 'inactive'].map(
  (s) => ({ value: s, label: s })
);

export const contactsAdapter = createRestAdapter<ContactRow>({
  basePath: '/api/contacts',
  tagsField: 'tags',
  editFields: [
    { id: 'status', label: 'Status', type: 'select', options: CONTACT_STATUS_OPTIONS },
    { id: 'company', label: 'Company' },
    { id: 'industry', label: 'Industry' },
  ],
  merge: {
    path: '/api/contacts/merge',
    fillKeys: ['email', 'phone', 'company', 'industry', 'address', 'city', 'state', 'country', 'tags', 'notes'],
  },
});

export const DEAL_STAGE_OPTIONS: SelectOption[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed-won',
  'closed-lost',
].map((s) => ({ value: s, label: s }));

export const dealsAdapter = createRestAdapter<{ id: number | string }>({
  basePath: '/api/deals',
  editFields: [
    { id: 'stage', label: 'Stage', type: 'select', options: DEAL_STAGE_OPTIONS },
    { id: 'status', label: 'Status' },
  ],
});

export const TASK_STATUS_OPTIONS: SelectOption[] = ['pending', 'in-progress', 'completed', 'cancelled'].map((s) => ({
  value: s,
  label: s,
}));
export const TASK_PRIORITY_OPTIONS: SelectOption[] = ['low', 'medium', 'high'].map((s) => ({ value: s, label: s }));

/** The only assignable owner we can resolve client-side is the signed-in user. */
const currentUserOption = async (): Promise<SelectOption[]> => {
  const { data } = await supabase.auth.getUser();
  return data.user ? [{ value: data.user.id, label: 'Me' }] : [];
};

export const tasksAdapter = createRestAdapter<{ id: number | string }>({
  basePath: '/api/tasks',
  ownerField: 'assignedTo',
  loadOwnerOptions: currentUserOption,
  editFields: [
    { id: 'status', label: 'Status', type: 'select', options: TASK_STATUS_OPTIONS },
    { id: 'priority', label: 'Priority', type: 'select', options: TASK_PRIORITY_OPTIONS },
  ],
});
