import { triggerWorkflowsForEvent, type WorkflowTriggerType } from '@smartcrm/workflows';
import { supabase } from '../supabase';

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
  skipQueuedDuplicate(type, objectType, String(record.id));
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

/**
 * DB triggers also enqueue every record change into workflow_event_queue (for changes made
 * outside the API). This API-originated event already fires workflows directly, so mark the
 * matching pending queue row 'skipped' to avoid running them twice. The scheduler only drains
 * rows older than 10s, which leaves time for this to land. Best effort: errors are ignored.
 */
function skipQueuedDuplicate(type: string, objectType: string, recordId: string): void {
  if (!supabase) return;
  Promise.resolve(
    supabase
      .from('workflow_event_queue')
      .update({ status: 'skipped', processed_at: new Date().toISOString() })
      .eq('status', 'pending')
      .eq('event_type', type)
      .eq('object_type', objectType)
      .eq('record_id', recordId)
  ).catch(() => undefined);
}
