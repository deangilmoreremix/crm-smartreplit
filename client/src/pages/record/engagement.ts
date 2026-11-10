/** Engagement for a contact, derived only from real record counts (no invented percentages). */
export interface EngagementInput {
  /** null = the source could not be read. */
  activities: number | null;
  notes: number | null;
  tasks: Array<{ status?: string | null }> | null;
  deals: Array<{ stage?: string | null; status?: string | null }> | null;
}

export interface EngagementSummary {
  activities: number | null;
  notes: number | null;
  tasksTotal: number | null;
  tasksCompleted: number | null;
  /** 0-100, or null when the contact has no tasks. */
  taskCompletionPct: number | null;
  deals: number | null;
  openDeals: number | null;
  /** Sum of the available counts. */
  totalTouchpoints: number;
}

const isClosed = (d: { stage?: string | null; status?: string | null }) =>
  /closed|won|lost/i.test(`${d.stage ?? ''} ${d.status ?? ''}`);

export function computeEngagement(input: EngagementInput): EngagementSummary {
  const tasksTotal = input.tasks ? input.tasks.length : null;
  const tasksCompleted = input.tasks ? input.tasks.filter((t) => t.status === 'completed').length : null;
  const deals = input.deals ? input.deals.length : null;
  const openDeals = input.deals ? input.deals.filter((d) => !isClosed(d)).length : null;
  return {
    activities: input.activities,
    notes: input.notes,
    tasksTotal,
    tasksCompleted,
    taskCompletionPct: tasksTotal ? Math.round(((tasksCompleted ?? 0) / tasksTotal) * 100) : null,
    deals,
    openDeals,
    totalTouchpoints: (input.activities ?? 0) + (input.notes ?? 0) + (tasksTotal ?? 0) + (deals ?? 0),
  };
}
