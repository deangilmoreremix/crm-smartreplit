export type WorkflowTriggerType =
  | 'RECORD_CREATED'
  | 'RECORD_UPDATED'
  | 'RECORD_DELETED'
  | 'MANUAL'
  | 'SCHEDULED'
  | 'WEBHOOK'
  | 'AI_COMPLETED';

export interface WorkflowEvent {
  type: WorkflowTriggerType;
  tenantId: string;
  userId: string;
  recordId?: string;
  objectType?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export type WorkflowEventHandler = (event: WorkflowEvent) => Promise<void>;

class WorkflowEventEmitter {
  private handlers: Map<WorkflowTriggerType, Set<WorkflowEventHandler>> = new Map();

  on(eventType: WorkflowTriggerType, handler: WorkflowEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: WorkflowTriggerType, handler: WorkflowEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async emit(event: WorkflowEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map((handler) =>
          handler(event).catch((error) => {
            console.error(`Error in workflow event handler for ${event.type}:`, error);
          })
        )
      );
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const workflowEventEmitter = new WorkflowEventEmitter();

export async function emitWorkflowEvent(event: WorkflowEvent): Promise<void> {
  await workflowEventEmitter.emit(event);
}

export async function emitRecordCreated(
  tenantId: string,
  userId: string,
  objectType: string,
  recordId: string,
  data?: Record<string, unknown>
): Promise<void> {
  await emitWorkflowEvent({
    type: 'RECORD_CREATED',
    tenantId,
    userId,
    objectType,
    recordId,
    data,
    timestamp: new Date(),
  });
}

export async function emitRecordUpdated(
  tenantId: string,
  userId: string,
  objectType: string,
  recordId: string,
  data?: Record<string, unknown>
): Promise<void> {
  await emitWorkflowEvent({
    type: 'RECORD_UPDATED',
    tenantId,
    userId,
    objectType,
    recordId,
    data,
    timestamp: new Date(),
  });
}

export async function emitRecordDeleted(
  tenantId: string,
  userId: string,
  objectType: string,
  recordId: string
): Promise<void> {
  await emitWorkflowEvent({
    type: 'RECORD_DELETED',
    tenantId,
    userId,
    objectType,
    recordId,
    timestamp: new Date(),
  });
}

export async function emitAICompleted(
  tenantId: string,
  userId: string,
  taskId: string,
  result: Record<string, unknown>
): Promise<void> {
  await emitWorkflowEvent({
    type: 'AI_COMPLETED',
    tenantId,
    userId,
    recordId: taskId,
    data: result,
    timestamp: new Date(),
  });
}

export function setupWorkflowTriggerHandlers(
  triggerHandlers: Map<string, (event: WorkflowEvent) => Promise<void>>
): void {
  const eventTypes: WorkflowTriggerType[] = [
    'RECORD_CREATED',
    'RECORD_UPDATED',
    'RECORD_DELETED',
    'AI_COMPLETED',
  ];

  for (const eventType of eventTypes) {
    const handler = triggerHandlers.get(eventType);
    if (handler) {
      workflowEventEmitter.on(eventType, handler);
    }
  }
}

export async function triggerWorkflowsForEvent(event: WorkflowEvent): Promise<void> {
  const [{ supabase }, { runWorkflow, resumeWaitersForEvent }] = await Promise.all([
    import('../supabase'),
    import('../engine/runner'),
  ]);

  // Runs paused on wait_for_event for this event continue before new runs start.
  if (event.type !== 'MANUAL' && event.type !== 'SCHEDULED' && event.type !== 'WEBHOOK') {
    await resumeWaitersForEvent(event.userId, event.type, event.objectType, {
      ...(event.data || {}),
      objectType: event.objectType,
      recordId: event.recordId,
    }).catch((e) => console.error('Error resuming event waiters:', e));
  }

  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('id, trigger_config')
    .eq('trigger_type', event.type)
    .eq('enabled', true)
    .eq('user_id', event.userId);

  if (error) {
    console.error('Error fetching workflows for event:', error);
    return;
  }

  for (const workflow of workflows || []) {
    // Optional per-workflow filter: trigger_config.objectType (e.g. "contacts")
    const wanted = (workflow.trigger_config as Record<string, unknown> | null)?.objectType;
    if (wanted && event.objectType && wanted !== event.objectType) continue;

    try {
      await runWorkflow({
        workflowId: workflow.id,
        userId: event.userId,
        triggerType: event.type,
        recordId: event.recordId,
        triggerData: { ...(event.data || {}), objectType: event.objectType, recordId: event.recordId },
      });
    } catch (e) {
      console.error(`Workflow ${workflow.id} failed to run:`, e);
    }
  }
}
