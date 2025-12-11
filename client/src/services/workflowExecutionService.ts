
/**
 * Workflow Execution Service
 * Handles the execution and management of AI-driven workflows
 */

import { logger } from './logger.service';
import { contactStore } from '../store/contactStore';
import { dealStore } from '../store/dealStore';
import { aiOrchestrator } from './ai-orchestrator.service';

export interface WorkflowAction {
  type: 'query_crm' | 'send_email' | 'create_task' | 'update_deal' | 'schedule_meeting' | 'analyze_data';
  parameters: Record<string, any>;
  retryCount?: number;
  timeout?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
  errors: string[];
}

class WorkflowExecutionService {
  private executions = new Map<string, WorkflowExecution>();
  
  async executeWorkflow(workflowId: string, steps: any[]): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      currentStep: 0,
      startedAt: new Date(),
      results: {},
      errors: []
    };
    
    this.executions.set(executionId, execution);
    
    try {
      logger.info('Starting workflow execution', { workflowId, executionId });
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        execution.currentStep = i;
        
        try {
          const result = await this.executeStep(step);
          execution.results[step.id] = result;
          
          logger.info('Workflow step completed', { 
            workflowId, 
            executionId, 
            stepId: step.id,
            stepName: step.name 
          });
          
        } catch (error) {
          const errorMessage = `Step ${step.name} failed: ${error.message}`;
          execution.errors.push(errorMessage);
          execution.status = 'failed';
          
          logger.error('Workflow step failed', error as Error, {
            workflowId,
            executionId,
            stepId: step.id
          });
          
          throw error;
        }
      }
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      
      logger.info('Workflow execution completed', { workflowId, executionId });
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      
      logger.error('Workflow execution failed', error as Error, { workflowId, executionId });
    }
    
    return execution;
  }
  
  private async executeStep(step: any): Promise<any> {
    const action: WorkflowAction = {
      type: step.action,
      parameters: step.parameters,
      timeout: 30000
    };
    
    switch (action.type) {
      case 'query_crm':
        return this.executeQueryCRM(action);
      
      case 'send_email':
        return this.executeSendEmail(action);
      
      case 'create_task':
        return this.executeCreateTask(action);
      
      case 'update_deal':
        return this.executeUpdateDeal(action);
      
      case 'schedule_meeting':
        return this.executeScheduleMeeting(action);
      
      case 'analyze_data':
        return this.executeAnalyzeData(action);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  private async executeQueryCRM(action: WorkflowAction): Promise<any> {
    const { filter, timeframe } = action.parameters;
    
    try {
      let results: any[] = [];
      
      if (filter === 'new_leads') {
        // Get recent contacts
        const contacts = contactStore.getState().contacts;
        const cutoffDate = new Date();
        if (timeframe === '24h') cutoffDate.setHours(cutoffDate.getHours() - 24);
        else if (timeframe === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
        
        results = Object.values(contacts).filter(contact => 
          new Date(contact.createdAt || contact.updatedAt || '') > cutoffDate
        );
      } else if (filter === 'deals') {
        const deals = dealStore.getState().deals;
        results = Object.values(deals);
      }
      
      return {
        count: results.length,
        data: results.slice(0, 50) // Limit results
      };
      
    } catch (error) {
      throw new Error(`CRM query failed: ${error.message}`);
    }
  }
  
  private async executeSendEmail(action: WorkflowAction): Promise<any> {
    const { template, recipients, personalized } = action.parameters;
    
    try {
      // Simulate email sending
      const emailResult = await aiOrchestrator.executeImmediate({
        type: 'email_generation',
        priority: 'medium',
        data: {
          template,
          recipients: recipients || 'auto',
          personalized: personalized || true
        }
      });
      
      return {
        sent: true,
        messageId: `msg_${Date.now()}`,
        recipients: Array.isArray(recipients) ? recipients.length : 1,
        template,
        result: emailResult
      };
      
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
  
  private async executeCreateTask(action: WorkflowAction): Promise<any> {
    const { type, delay, assignee, description } = action.parameters;
    
    try {
      const task = {
        id: `task_${Date.now()}`,
        type,
        title: description || `Automated ${type.replace('_', ' ')}`,
        assignee: assignee || 'system',
        dueDate: delay ? this.calculateDueDate(delay) : new Date(),
        status: 'pending',
        automated: true,
        createdAt: new Date()
      };
      
      // In a real implementation, this would save to your task store
      logger.info('Task created', { taskId: task.id, type, delay });
      
      return task;
      
    } catch (error) {
      throw new Error(`Task creation failed: ${error.message}`);
    }
  }
  
  private async executeUpdateDeal(action: WorkflowAction): Promise<any> {
    const { dealId, updates } = action.parameters;
    
    try {
      const deals = dealStore.getState().deals;
      const deal = deals[dealId];
      
      if (!deal) {
        throw new Error(`Deal ${dealId} not found`);
      }
      
      // Update deal
      const updatedDeal = { ...deal, ...updates, updatedAt: new Date().toISOString() };
      
      // In a real implementation, this would call dealStore.updateDeal
      logger.info('Deal updated', { dealId, updates });
      
      return updatedDeal;
      
    } catch (error) {
      throw new Error(`Deal update failed: ${error.message}`);
    }
  }
  
  private async executeScheduleMeeting(action: WorkflowAction): Promise<any> {
    const { attendees, duration, subject, date } = action.parameters;
    
    try {
      const meeting = {
        id: `meeting_${Date.now()}`,
        subject: subject || 'Automated Meeting',
        attendees: attendees || [],
        duration: duration || 30,
        scheduledDate: date || this.calculateDueDate('1_day'),
        automated: true,
        createdAt: new Date()
      };
      
      logger.info('Meeting scheduled', { meetingId: meeting.id, subject, attendees: meeting.attendees.length });
      
      return meeting;
      
    } catch (error) {
      throw new Error(`Meeting scheduling failed: ${error.message}`);
    }
  }
  
  private async executeAnalyzeData(action: WorkflowAction): Promise<any> {
    const { dataType, metrics, timeframe } = action.parameters;
    
    try {
      const analysis = await aiOrchestrator.executeImmediate({
        type: 'predictive_analytics',
        priority: 'medium',
        data: {
          dataType,
          metrics: metrics || ['conversion_rate', 'deal_velocity'],
          timeframe: timeframe || '30d'
        }
      });
      
      return {
        dataType,
        metrics,
        timeframe,
        results: analysis.result,
        generatedAt: new Date()
      };
      
    } catch (error) {
      throw new Error(`Data analysis failed: ${error.message}`);
    }
  }
  
  private calculateDueDate(delay: string): Date {
    const date = new Date();
    
    if (delay.includes('hour')) {
      const hours = parseInt(delay.replace(/\D/g, ''));
      date.setHours(date.getHours() + hours);
    } else if (delay.includes('day')) {
      const days = parseInt(delay.replace(/\D/g, ''));
      date.setDate(date.getDate() + days);
    } else if (delay.includes('week')) {
      const weeks = parseInt(delay.replace(/\D/g, ''));
      date.setDate(date.getDate() + (weeks * 7));
    }
    
    return date;
  }
  
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }
  
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
  
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      return true;
    }
    return false;
  }
  
  resumeExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      return true;
    }
    return false;
  }
}

export const workflowExecutionService = new WorkflowExecutionService();
