/**
 * Twenty CRM Integration - SmartCRM Enhancement
 *
 * This module integrates Twenty CRM features into SmartCRM without removing
 * any existing functionality. All new features are additive.
 *
 * New Features Available:
 * - DynamicFieldRenderer: Renders fields based on metadata types
 * - KanbanBoard/KanbanColumn/KanbanCard: Drag-and-drop Kanban views
 * - ViewSwitcher: Toggle between table/kanban/calendar views
 * - FilterBuilder: Advanced filtering UI
 *
 * Schema Enhancements (in packages/shared/schema.ts):
 * - customFields: JSONB for custom field data on contacts/deals/tasks
 * - position: Integer for drag-drop ordering
 * - healthScore/winProbability: Deal health metrics
 * - objectMetadata/fieldMetadata: EAV metadata tables
 * - views: Saved view configurations
 * - workflows: Automation engine
 */

export { DynamicFieldRenderer } from '../packages/ui/src/components/DynamicFieldRenderer';
export { KanbanBoard } from '../packages/ui/src/components/KanbanBoard';
export { KanbanColumn } from '../packages/ui/src/components/KanbanColumn';
export { KanbanCard } from '../packages/ui/src/components/KanbanCard';
export { ViewSwitcher } from '../packages/ui/src/components/ViewSwitcher';
export { FilterBuilder } from '../packages/ui/src/components/FilterBuilder';

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
} from '../packages/shared/schema';

export type {
  KanbanColumnData,
  KanbanCardData,
  FilterCondition,
  ViewFilter,
  ViewSort,
} from '../packages/shared/types';
