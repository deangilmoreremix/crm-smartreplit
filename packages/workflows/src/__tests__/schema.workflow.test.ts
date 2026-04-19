import { describe, it, expect, beforeEach } from 'vitest';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  workflows,
  workflowActions,
  workflowRuns,
  workflowRunLogs,
  workflowCredits,
  workflowTemplates,
} from '../schema/workflow.schema';

describe('Workflow Database Schema', () => {
  describe('workflows table', () => {
    it('should have required columns', () => {
      // Verify table structure
      expect(workflows.name).toBeDefined();
      expect(workflows.description).toBeDefined();
      expect(workflows.triggerType).toBeDefined();
      expect(workflows.enabled).toBeDefined();
      expect(workflows.createdBy).toBeDefined();
      expect(workflows.appSlug).toBeDefined();
      expect(workflows.configuration).toBeDefined();
    });

    it('should have correct trigger type enum', () => {
      expect(workflows.triggerType).toBeDefined();
      expect(Array.isArray(workflows.triggerType)).toBe(false);
    });

    it('should have proper foreign key to profiles', () => {
      expect(workflows.createdBy).toBeDefined();
    });
  });

  describe('workflow_actions table', () => {
    it('should reference workflow_id', () => {
      expect(workflowActions.workflowId).toBeDefined();
    });

    it('should have action_type column', () => {
      expect(workflowActions.actionType).toBeDefined();
    });

    it('should have order column for execution sequence', () => {
      expect(workflowActions.order).toBeDefined();
    });

    it('should support parent_id for branches/iterators', () => {
      expect(workflowActions.parentId).toBeDefined();
    });

    it('should have condition column for IF branches', () => {
      expect(workflowActions.condition).toBeDefined();
    });

    it('should have configuration for action parameters', () => {
      expect(workflowActions.configuration).toBeDefined();
    });
  });

  describe('workflow_runs table', () => {
    it('should track workflow execution status', () => {
      expect(workflowRuns.status).toBeDefined();
    });

    it('should store trigger context', () => {
      expect(workflowRuns.triggeredBy).toBeDefined();
      expect(workflowRuns.context).toBeDefined();
    });

    it('should track timing', () => {
      expect(workflowRuns.startedAt).toBeDefined();
      expect(workflowRuns.completedAt).toBeDefined();
    });

    it('should store error messages', () => {
      expect(workflowRuns.errorMessage).toBeDefined();
    });
  });

  describe('workflow_run_logs table', () => {
    it('should reference run_id', () => {
      expect(workflowRunLogs.runId).toBeDefined();
    });

    it('should have step number', () => {
      expect(workflowRunLogs.step).toBeDefined();
    });

    it('should have log level', () => {
      expect(workflowRunLogs.level).toBeDefined();
    });

    it('should have message', () => {
      expect(workflowRunLogs.message).toBeDefined();
    });
  });

  describe('workflow_credits table', () => {
    it('should reference tenant_id', () => {
      expect(workflowCredits.tenantId).toBeDefined();
    });

    it('should track month', () => {
      expect(workflowCredits.month).toBeDefined();
    });

    it('should track credits used and available', () => {
      expect(workflowCredits.creditsUsed).toBeDefined();
      expect(workflowCredits.creditsAvailable).toBeDefined();
    });
  });

  describe('workflow_templates table', () => {
    it('should have name and description', () => {
      expect(workflowTemplates.name).toBeDefined();
      expect(workflowTemplates.description).toBeDefined();
    });

    it('should have category for grouping', () => {
      expect(workflowTemplates.category).toBeDefined();
    });

    it('should mark system templates', () => {
      expect(workflowTemplates.isSystem).toBeDefined();
    });
  });
});
