import { triggerWorkflowsForEvent, type WorkflowTriggerType } from '@smartcrm/workflows';

/**
 * Fire workflows for a CRM record change. Fire-and-forget: never throws and never delays the
 * HTTP response. Workflows are looked up by owner (userId) and trigger type.
 */
export function emitCrmEvent(
  type: Extract<WorkflowTriggerType, 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED'>,
  objectType: 'contacts' | 'deals' | 'tasks',
  userId: string | undefined,
  record: { id?: unknown } & Record<string, unknown>
): void {
  if (!userId || record?.id === undefined || record?.id === null) return;
  triggerWorkflowsForEvent({
    type,
    tenantId: userId,
    userId,
    objectType,
    recordId: String(record.id),
    data: record,
    timestamp: new Date(),
  }).catch((error) => console.error(`Workflow trigger failed for ${objectType}:`, error));
}
