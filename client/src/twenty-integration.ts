/**
 * Twenty CRM Integration - SmartCRM Enhancement
 *
 * This module integrates Twenty CRM features into SmartCRM without removing
 * any existing functionality. All new features are additive.
 *
 * New Features Available:
 * - DynamicFieldRenderer: Renders fields based on metadata types
 * - KanbanBoard/KanbanColumn/KanbanCard: Kanban views
 * - ViewSwitcher: Toggle between table/kanban/calendar views
 * - FilterBuilder: Advanced filtering UI
 *
 * Used by the "Board" tab on the Contacts and Pipeline pages (components/twenty/).
 *
 * Schema Enhancements (in packages/shared/schema.ts):
 * - customFields: JSONB for custom field data on contacts/deals/tasks
 * - position: Integer for drag-drop ordering
 * - healthScore/winProbability: Deal health metrics
 * - objectMetadata/fieldMetadata: EAV metadata tables
 * - views: Saved view configurations
 * - workflows: Automation engine
 */

export { DynamicFieldRenderer } from '@crm/ui/components/DynamicFieldRenderer';
export { KanbanBoard } from '@crm/ui/components/KanbanBoard';
export { KanbanColumn } from '@crm/ui/components/KanbanColumn';
export { KanbanCard } from '@crm/ui/components/KanbanCard';
export { ViewSwitcher } from '@crm/ui/components/ViewSwitcher';
export { FilterBuilder } from '@crm/ui/components/FilterBuilder';

// Re-export shared types
export type {
  FieldType,
  ViewType,
  WorkflowTriggerType,
  WorkflowRunStatus,
  ObjectMetadata,
  FieldMetadata,
  View,
  Workflow,
  WorkflowRun,
  Role,
  Permission,
} from '../../packages/shared/schema';

export type { KanbanColumnData, KanbanCardData } from '@crm/ui/components/KanbanBoard';

export type { FilterCondition, ViewFilter, ViewSort } from '../../packages/shared/types';
