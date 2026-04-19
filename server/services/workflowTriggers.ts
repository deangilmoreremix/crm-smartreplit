import { supabase } from '../../supabase';
import { emitRecordCreated, emitRecordUpdated, emitRecordDeleted } from '@smartcrm/workflows';

export async function setupWorkflowTriggers(): Promise<void> {
  const { error } = await supabase.rpc('setup_workflow_triggers', {
    trigger_config: {
      tables: ['contacts', 'deals', 'tasks', 'companies', 'activities'],
      events: ['INSERT', 'UPDATE', 'DELETE'],
    },
  });

  if (error) {
    console.error('Error setting up workflow triggers:', error);
  }
}

export interface RecordChangeEvent {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  userId: string;
  tenantId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function handleRecordChange(event: RecordChangeEvent): Promise<void> {
  const { table, operation, recordId, userId, tenantId, oldData, newData } = event;

  switch (operation) {
    case 'INSERT':
      await emitRecordCreated(tenantId, userId, table, recordId, newData);
      break;
    case 'UPDATE':
      await emitRecordUpdated(tenantId, userId, table, recordId, { old: oldData, new: newData });
      break;
    case 'DELETE':
      await emitRecordDeleted(tenantId, userId, table, recordId);
      break;
  }
}

export async function checkAndTriggerWorkflows(
  tenantId: string,
  userId: string,
  triggerType: string,
  objectType: string,
  recordId: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { supabase } = await import('../../supabase');

  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('app_slug', objectType.toLowerCase())
    .eq('enabled', true)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error finding workflows:', error);
    return;
  }

  for (const workflow of workflows || []) {
    console.log(`Triggering workflow: ${workflow.name} for ${objectType}:${recordId}`);
  }
}

export function createChangeDetector(tableName: string) {
  return async function detectChanges(
    tenantId: string,
    userId: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
  ): Promise<void> {
    await handleRecordChange({
      table: tableName,
      operation,
      recordId,
      userId,
      tenantId,
      oldData,
      newData,
    });
  };
}

export const detectContactChanges = createChangeDetector('contacts');
export const detectDealChanges = createChangeDetector('deals');
export const detectTaskChanges = createChangeDetector('tasks');
export const detectCompanyChanges = createChangeDetector('companies');
